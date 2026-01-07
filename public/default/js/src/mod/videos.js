$(document).ready(function() {
    let allVideos = [];
    let currentFilter = 'all';

    // HTML escaping function to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Validate video URL
    function isValidVideoUrl(url) {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Load videos with cursorPagination pagination
    function loadVideos(cursorPagination = null, append = false) {
        if (!append) {
            $('#loading').show();
            $('#videos').hide();
            $('#empty-state').hide();
        }

        $.ajax({
            url: '/videos',
            type: 'GET',
            data: {
                limit: 20,
                ...(cursorPagination && { cursorPagination: cursorPagination }),
                ...(currentFilter !== 'all' && { flagged: currentFilter })
            },
            success: function(response) {
                if (response.status === 'success') {
                    if (append) {
                        allVideos = allVideos.concat(response.data);
                    } else {
                        allVideos = response.data;
                    }
                    
                    renderVideos(allVideos, !append);
                    
                    // Handle load more button
                    if (response.page && response.page.hasMore) {
                        showLoadMoreButton(response.page.nextCursorPagination);
                    } else {
                        hideLoadMoreButton();
                    }
                } else {
                    if (!append) $('#empty-state').show();
                }
            },
            error: function() {
                if (!append) $('#empty-state').show();
                if (typeof toastr !== 'undefined') {
                    toastr.error('Failed to load videos');
                }
            },
            complete: function() {
                if (!append) $('#loading').hide();
            }
        });
    }

    // Render video cards
    function renderVideos(videos, clear = true) {
        const $container = $('#videos');
        if (clear) $container.empty();

        if (videos.length === 0 && clear) {
            $('#empty-state').show();
            return;
        }

        $('#videos').show();
        videos.forEach(function(video) {
            const uploadDate = video.createdAt?.seconds 
                ? new Date(video.createdAt.seconds * 1000).toLocaleDateString()
                : 'N/A';
            
            const isFlagged = video.flagged === true;
            const flaggedClass = isFlagged ? 'border-danger' : '';
            const statusBadge = isFlagged 
                ? '<span class="badge bg-danger"><i class="fas fa-flag"></i> Flagged</span>'
                : '<span class="badge bg-success"><i class="fas fa-check"></i> Active</span>';
            
            const videoId = escapeHtml(video.id);
            const actionButton = isFlagged
                ? `<button class="btn btn-sm btn-success unflag-video" data-id="${videoId}" title="Remove flag">
                     <i class="fas fa-check"></i> Unflag
                   </button>`
                : `<button class="btn btn-sm btn-danger flag-video" data-id="${videoId}" title="Flag for review">
                     <i class="fas fa-flag"></i> Flag
                   </button>`;

            const flagReason = isFlagged && video.flagReason 
                ? `<small class="text-danger"><i class="fas fa-exclamation-triangle"></i> ${escapeHtml(video.flagReason)}</small>`
                : '';

            const videoElement = isValidVideoUrl(video.url)
                ? `<video class="card-img-top" controls style="height: 200px; object-fit: cover;">
                     <source src="${escapeHtml(video.url)}" type="video/mp4">
                   </video>`
                : '<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;"><i class="fas fa-video fa-2x text-muted"></i></div>';

            $container.append(`
                <div class="col">
                    <div class="card h-100 ${flaggedClass}" data-flagged="${isFlagged}">
                        ${isFlagged ? '<div class="position-absolute top-0 end-0 p-2"><i class="fas fa-flag text-danger"></i></div>' : ''}
                        ${videoElement}
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title">${escapeHtml(video.uploaderName || 'Unknown')}</h6>
                            <p class="card-text text-muted small">${uploadDate}</p>
                            ${flagReason}
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                ${statusBadge}
                                ${actionButton}
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    // Load more functionality
    function showLoadMoreButton(nextCursorPagination) {
        $('#load-more-container').remove();
        $('#videos').after(`
            <div id="load-more-container" class="text-center mt-4">
                <button id="load-more-btn" class="btn btn-primary" data-cursor-pagination="${nextCursorPagination}">
                    <i class="fas fa-plus"></i> Load More Videos
                </button>
            </div>
        `);
    }

    function hideLoadMoreButton() {
        $('#load-more-container').remove();
    }

    // Load more button click handler
    $(document).on('click', '#load-more-btn', function() {
        const cursorPagination = $(this).data('cursor-pagination');
        const $btn = $(this);
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
        
        loadVideos(cursorPagination, true);
    });

    // Filter videos
    function filterVideos(filter) {
        currentFilter = filter;
        allVideos = [];
        hideLoadMoreButton();
        loadVideos();
    }

    // Filter buttons
    $('.filter-btn').on('click', function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        filterVideos(currentFilter);
    });

    // Setup modal event listener once
    $('#flagModal').on('hidden.bs.modal', function() {
        $('.card').removeClass('border-warning');
    });

    // Flag video with confirmation
    $(document).on('click', '.flag-video', function() {
        const videoId = $(this).data('id');
        const $card = $(this).closest('.card');
        
        $card.addClass('border-warning');
        $('#flagVideoId').val(videoId);
        $('#flagReason').val('').focus();
        $('#flagModal').modal('show');
    });

    $('#confirmFlag').on('click', function() {
        const videoId = $('#flagVideoId').val();
        const reason = $('#flagReason').val().trim();

        if (!reason) {
            $('#flagReason').addClass('is-invalid');
            return;
        }

        $('#flagReason').removeClass('is-invalid');
        const $btn = $(this);
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Flagging...');

        $.ajax({
            url: `/videos/${videoId}/flag`,
            type: 'POST',
            data: { reason },
            success: function(response) {
                $('#flagModal').modal('hide');
                $('#flagReason').val('');
                if (typeof toastr !== 'undefined') {
                    toastr.success('Video flagged successfully');
                }
                // Reset and reload from beginning
                allVideos = [];
                hideLoadMoreButton();
                loadVideos();
            },
            error: function(xhr) {
                const message = xhr.responseJSON?.message || 'Failed to flag video';
                if (typeof toastr !== 'undefined') {
                    toastr.error(message);
                }
            },
            complete: function() {
                $btn.prop('disabled', false).html('Flag Video');
            }
        });
    });

    // Unflag video with confirmation
    $(document).on('click', '.unflag-video', function() {
        const videoId = $(this).data('id');
        const $btn = $(this);
        
        if (!confirm('Remove flag from this video?')) {
            return;
        }
        
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
        
        $.ajax({
            url: `/videos/${videoId}/unflag`,
            type: 'POST',
            success: function(response) {
                if (typeof toastr !== 'undefined') {
                    toastr.success('Video unflagged successfully');
                }
                // Reset and reload from beginning
                allVideos = [];
                hideLoadMoreButton();
                loadVideos();
            },
            error: function(xhr) {
                const message = xhr.responseJSON?.message || 'Failed to unflag video';
                if (typeof toastr !== 'undefined') {
                    toastr.error(message);
                }
            },
            complete: function() {
                $btn.prop('disabled', false).html('<i class="fas fa-check"></i> Unflag');
            }
        });
    });

    // Initialize
    loadVideos();
});
