$(document).ready(function() {
    let allVideos = [];
    let currentFilter = 'all';

    // Load videos with cursor pagination
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
            error: function(xhr, status, error) {
                if (!append) $('#empty-state').show();
                toastr.error('Failed to load videos');
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
            const date = new Date(video.timestamp?._seconds * 1000);
            const uploadDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
            
            const isFlagged = video.flagged === true;
            const flaggedClass = isFlagged ? 'border-danger' : '';
            const statusBadge = isFlagged 
                ? '<span class="badge bg-danger"><i class="fas fa-flag"></i> Flagged</span>'
                : '<span class="badge bg-success"><i class="fas fa-check"></i> Active</span>';
            
            const flagReason = isFlagged && video.flagReason 
                ? `<div class="alert alert-danger alert-sm mt-2 mb-0 p-2">
                     <small><strong>Reason:</strong> ${video.flagReason}</small>
                   </div>`
                : '';
            
            const actionButton = isFlagged
                ? `<button class="btn btn-sm btn-success unflag-video" data-id="${video.id}">
                     <i class="fas fa-check"></i> Unflag
                   </button>`
                : `<button class="btn btn-sm btn-danger flag-video" data-id="${video.id}">
                     <i class="fas fa-flag"></i> Flag
                   </button>`;

            $container.append(`
                <div class="col">
                    <div class="card h-100 ${flaggedClass}">
                        <video class="card-img-top" controls style="height: 200px; object-fit: cover;">
                            <source src="${video.url}" type="video/mp4">
                        </video>
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title">${video.uploaderName || 'Unknown'}</h6>
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

    // Show or update load more button
    function showLoadMoreButton(nextCursorPagination) {
        let $container = $('#load-more-container');
        
        if ($container.length === 0) {
            $('#videos').after(`
                <div id="load-more-container" class="text-center mt-4">
                    <button id="load-more-btn" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Load More Videos
                    </button>
                </div>
            `);
            $container = $('#load-more-container');
        }
        
        const $btn = $('#load-more-btn');
        $btn.data('cursor-pagination', nextCursorPagination)
            .prop('disabled', false)
            .html('<i class="fas fa-plus"></i> Load More Videos');
    }

    function hideLoadMoreButton() {
        $('#load-more-container').remove();
    }

    // Load more button click handler
    $(document).on('click', '#load-more-btn', function() {
        const $btn = $(this);
        const cursorPagination = $btn.data('cursor-pagination');
        
        if (!cursorPagination) {
            toastr.error('Unable to load more videos');
            return;
        }
        
        $btn.prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> Loading...');
        
        loadVideos(cursorPagination, true);
    });

    // Filter functionality
    $('.filter-btn').on('click', function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        
        allVideos = [];
        hideLoadMoreButton();
        loadVideos();
    });

    // Flag video - show modal
    $(document).on('click', '.flag-video', function() {
        const videoId = $(this).data('id');
        $('#flagVideoId').val(videoId);
        $('#flagReason').val('').removeClass('is-invalid');
        $('#flagModal').modal('show');
    });

    // Confirm flag from modal
    $('#confirmFlag').on('click', function() {
        const videoId = $('#flagVideoId').val();
        const reason = $('#flagReason').val().trim();

        if (!reason) {
            $('#flagReason').addClass('is-invalid');
            return;
        }

        $.ajax({
            url: `/videos/${videoId}/flag`,
            type: 'POST',
            data: { reason },
            success: function(response) {
                $('#flagModal').modal('hide');
                toastr.success('Video flagged successfully');
                allVideos = [];
                hideLoadMoreButton();
                loadVideos();
            },
            error: function(xhr) {
                toastr.error('Failed to flag video');
            }
        });
    });

    // Unflag video
    $(document).on('click', '.unflag-video', function() {
        const videoId = $(this).data('id');
        
        if (!confirm('Remove flag from this video?')) return;
        
        $.post(`/videos/${videoId}/unflag`, function() {
            toastr.success('Video unflagged successfully');
            allVideos = [];
            hideLoadMoreButton();
            loadVideos();
        }).fail(function() {
            toastr.error('Failed to unflag video');
        });
    });

    // Initialize
    loadVideos();
});