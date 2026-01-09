$(document).ready(function() {
    let allVideos = [];
    let displayedVideoIds = new Set();
    let currentFilter = 'all';
    let uploaderSearch = '';
    let isLoading = false;

    // Persistent sticky button above footer
    const $stickyLoadMore = $('<button>', {
        id: 'sticky-load-more-btn',
        class: 'btn btn-primary position-fixed',
        css: {
            bottom: '60px',
            left: '60.66%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            display: 'none',
            padding: '12px 24px',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
        },
        html: '<i class="fas fa-plus"></i> Load More Videos'
    });

    $('body').append($stickyLoadMore);

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function loadVideos(cursorPagination = null, append = false) {
        if (isLoading) return;
        isLoading = true;

        if (!append) {
            $('#loading').show();
            $('#videos').hide();
            $('#empty-state').hide();
            $('#end-of-results').remove();
        }

        $.ajax({
            url: '/videos',
            type: 'GET',
            data: {
                limit: 20,
                ...(cursorPagination && { cursorPagination: cursorPagination }),
                ...(currentFilter !== 'all' && { flagged: currentFilter }),
                ...(uploaderSearch && { uploader: uploaderSearch }),
                excludeIds: JSON.stringify(Array.from(displayedVideoIds))
            },
            success: function(response) {
                if (response.status === 'success') {
                    const newVideos = response.data;
                    
                    // Track new video IDs
                    newVideos.forEach(video => {
                        displayedVideoIds.add(video.id);
                    });
                    
                    if (append) {
                        allVideos = allVideos.concat(newVideos);
                    } else {
                        allVideos = newVideos;
                    }
                    
                    renderVideos(allVideos, !append);
                    
                    // Handle pagination UI
                    if (response.page && response.page.hasMore) {
                        showLoadMoreButton(response.page.nextCursorPagination);
                    } else {
                        hideLoadMoreButton();
                        
                        if (allVideos.length > 0 && response.page?.isEndOfResults) {
                            showEndOfResultsMessage(response.page.filterDescription);
                        }
                    }

                    // Debug info
                    if (response.page?.debug) {
                        console.log('Pagination debug:', response.page.debug);
                    }

                    // Auto-fetch if got no new videos but more available
                    if (append && newVideos.length === 0 && response.page?.hasMore) {
                        console.log('Auto-fetching next batch...');
                        setTimeout(() => {
                            isLoading = false;
                            loadVideos(response.page.nextCursorPagination, true);
                        }, 100);
                        return;
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
                isLoading = false;
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

            // Check if video URL exists
            if (!video.url || video.url === 'undefined') {
                $container.append(`
                    <div class="col">
                        <div class="card h-100 ${flaggedClass}">
                            <div class="alert alert-danger text-center" style="height: 200px; line-height: 200px; margin: 0;">
                                <i class="fas fa-exclamation-triangle"></i> Video URL missing
                            </div>
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
                return;
            }

            $container.append(`
                <div class="col">
                    <div class="card h-100 ${flaggedClass}">
                        <video class="card-img-top" controls style="height: 200px; object-fit: cover;">
                            <source src="${video.url}" type="video/mp4">
                            Your browser does not support the video tag.
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

    function showLoadMoreButton(nextCursorPagination) {
        // Show persistent sticky button
        $stickyLoadMore
            .data('cursor-pagination', nextCursorPagination)
            .prop('disabled', false)
            .html('<i class="fas fa-plus"></i> Load More Videos')
            .fadeIn();
    }

    function hideLoadMoreButton() {
        $stickyLoadMore.hide();
    }

    function showEndOfResultsMessage(filterDescription) {
        $('#end-of-results').remove();
        
        $('#videos').after(`
            <div id="end-of-results" class="text-center mt-4 p-3">
                <div class="alert alert-info mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>End of results.</strong> No more videos available for <strong>${filterDescription}</strong>.
                </div>
            </div>
        `);
    }

    $(document).on('click', '#sticky-load-more-btn', function() {
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

    const debouncedSearch = debounce(() => {
        allVideos = [];
        displayedVideoIds.clear();
        hideLoadMoreButton();
        $('#end-of-results').remove();
        loadVideos();
    }, 500);

    $('#searchUploader').on('input', function() {
        uploaderSearch = $(this).val().trim();
        debouncedSearch();
    });

    $('.filter-btn').on('click', function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        
        $('#searchUploader').val('');
        uploaderSearch = '';
        
        allVideos = [];
        displayedVideoIds.clear();
        hideLoadMoreButton();
        $('#end-of-results').remove();
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
                displayedVideoIds.clear();
                hideLoadMoreButton();
                $('#end-of-results').remove();
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
            displayedVideoIds.clear();
            hideLoadMoreButton();
            $('#end-of-results').remove();
            loadVideos();
        }).fail(function() {
            toastr.error('Failed to unflag video');
        });
    });

    // Initialize
    loadVideos();
});