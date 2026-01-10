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

        // Special handling for reported videos
        if (currentFilter === 'reported') {
            loadReportedVideos(append);
            return;
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

    // Load reported videos from dedicated endpoint
    function loadReportedVideos(append = false) {
        $.ajax({
            url: '/videos/reported',
            type: 'GET',
            success: function(response) {
                if (response.status === 'success') {
                    const reportedVideos = response.data || [];

                    // Use reported videos directly - they already have all necessary fields
                    const videos = reportedVideos.map(video => {
                        return {
                            ...video,
                            isReported: true,
                            // Ensure user status is available for blocking functionality
                            userStatus: video.userStatus || 'active'
                        };
                    });

                    if (append) {
                        allVideos = allVideos.concat(videos);
                    } else {
                        allVideos = videos;
                    }

                    renderVideos(allVideos, !append);
                    hideLoadMoreButton();

                    if (videos.length > 0) {
                        $('#videos').after(`
                            <div id="end-of-results" class="text-center mt-4 p-3">
                                <div class="alert alert-info mb-0">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Showing ${videos.length} reported video(s)</strong>
                                </div>
                            </div>
                        `);
                    }
                } else {
                    if (!append) $('#empty-state').show();
                    toastr.error(response.message || 'Failed to load reported videos');
                }
            },
            error: function() {
                if (!append) $('#empty-state').show();
                toastr.error('Failed to load reported videos');
            },
            complete: function() {
                if (!append) $('#loading').hide();
                isLoading = false;
            }
        });
    }

    // Render video cards - Frontend is strictly a consumer of backend data
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

            // Extract user ID - try multiple field names (backend provides this)
            const userId = video.uid || video.userUid || video.userId || video.ownerId || video.uploaderId;

            // Get user status from backend data (no frontend decision making)
            const userStatus = video.userStatus || video.status || 'active';
            const isUserBlocked = userStatus === 'inactive';

            // Video flagging status
            const isFlagged = video.flagged === true;
            const isReported = video.isReported === true;

            // Card border: Orange for reported, Red for flagged, Yellow for blocked user
            let flaggedClass = '';
            if (isReported) {
                flaggedClass = 'border-warning';
            } else if (isFlagged) {
                flaggedClass = 'border-danger';
            } else if (isUserBlocked) {
                flaggedClass = 'border-warning';
            }

            // Status badges - show BOTH if video is flagged AND user is blocked
            let statusBadges = '';
            if (isReported) {
                statusBadges += `<span class="badge bg-warning text-dark me-1"><i class="fas fa-exclamation-triangle"></i> Reported (${video.reportCount || 1})</span>`;
            }
            if (isFlagged) {
                statusBadges += '<span class="badge bg-danger me-1"><i class="fas fa-flag"></i> Flagged</span>';
            }
            if (isUserBlocked) {
                statusBadges += '<span class="badge bg-warning text-dark me-1"><i class="fas fa-user-slash"></i> User Blocked</span>';
            }
            if (!isFlagged && !isUserBlocked && !isReported) {
                statusBadges = '<span class="badge bg-success"><i class="fas fa-check"></i> Active</span>';
            }

            // Alert messages for reported, flagged videos and blocked users
            let alertMessages = '';
            if (isReported && video.reportReason) {
                const reportDate = video.reportedAt?._seconds
                    ? new Date(video.reportedAt._seconds * 1000).toLocaleDateString()
                    : 'Unknown';
                
                // Show first report or summary
                alertMessages += `<div class="alert alert-warning alert-sm mt-2 mb-0 p-2">
                     <small><strong><i class="fas fa-exclamation-triangle"></i> Report:</strong> ${video.reportReason}</small><br>
                     <small class="text-muted">Reported by: ${video.reporterName || 'Unknown'} on ${reportDate}</small>`;
                
                // Add "View All" button if multiple reports
                if (video.reportCount > 1 && video.reporters && video.reporters.length > 1) {
                    alertMessages += `<br><button class="btn btn-sm btn-outline-info mt-1 view-reports" 
                        data-video-id="${video.id}" 
                        data-reports='${JSON.stringify(video.reporters)}'>
                        <i class="fas fa-list"></i> View All (${video.reportCount})
                    </button>`;
                }
                
                alertMessages += '</div>';
            }
            if (isFlagged && video.flagReason) {
                alertMessages += `<div class="alert alert-danger alert-sm mt-2 mb-0 p-2">
                     <small><strong>Flag Reason:</strong> ${video.flagReason}</small>
                   </div>`;
            }
            if (isUserBlocked) {
                alertMessages += `<div class="alert alert-warning alert-sm mt-2 mb-0 p-2">
                     <small><i class="fas fa-ban"></i> <strong>Account Blocked</strong></small>
                   </div>`;
            }

            // Action buttons - flag/unflag for videos
            const flagActionButton = isFlagged
                ? `<button class="btn btn-sm btn-success unflag-video" data-id="${video.id}">
                     <i class="fas fa-check"></i> Unflag
                   </button>`
                : `<button class="btn btn-sm btn-danger flag-video" data-id="${video.id}">
                     <i class="fas fa-flag"></i> Flag
                   </button>`;

            // User blocking buttons - only show if userId is available
            let userActionButton = '';
            if (userId) {
                if (isUserBlocked) {
                    userActionButton = `<button class="btn btn-sm btn-success unblock-user" data-userid="${userId}">
                         <i class="fas fa-unlock"></i> Unblock
                       </button>`;
                } else {
                    userActionButton = `<button class="btn btn-sm btn-warning block-user" data-userid="${userId}">
                         <i class="fas fa-ban"></i> Block
                       </button>`;
                }
            }

            // Blocked user overlay icon for video thumbnail
            const blockedOverlay = isUserBlocked
                ? `<div class="position-absolute top-0 end-0 m-2">
                     <span class="badge bg-warning text-dark rounded-circle" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                       <i class="fas fa-user-slash"></i>
                     </span>
                   </div>`
                : '';

            // Check if video URL exists - render card with blocked overlay if applicable
            if (!video.url || video.url === 'undefined') {
                $container.append(`
                    <div class="col">
                        <div class="card h-100 ${flaggedClass}">
                            <div class="position-relative">
                                <div class="alert alert-danger text-center" style="height: 200px; line-height: 200px; margin: 0;">
                                    <i class="fas fa-exclamation-triangle"></i> Video URL missing
                                </div>
                                ${blockedOverlay}
                            </div>
                            <div class="card-body d-flex flex-column">
                                <h6 class="card-title">${video.uploaderName || 'Unknown'}</h6>
                                <p class="card-text text-muted small">${uploadDate}</p>
                                ${alertMessages}
                                <div class="mt-auto">
                                    <div class="mb-2">${statusBadges}</div>
                                    <div class="d-flex gap-1 flex-wrap">
                                        ${flagActionButton}
                                        ${userActionButton}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
                return;
            }

            // Normal video card with all features
            $container.append(`
                <div class="col">
                    <div class="card h-100 ${flaggedClass}">
                        <div class="position-relative">
                            <video class="card-img-top" controls style="height: 200px; object-fit: cover;">
                                <source src="${video.url}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            ${blockedOverlay}
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title">${video.uploaderName || 'Unknown'}</h6>
                            <p class="card-text text-muted small">${uploadDate}</p>
                            ${alertMessages}
                            <div class="mt-auto">
                                <div class="mb-2">${statusBadges}</div>
                                <div class="d-flex gap-1 flex-wrap">
                                    ${flagActionButton}
                                    ${userActionButton}
                                </div>
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

    // Block user - show modal
    $(document).on('click', '.block-user', function() {
        const userId = $(this).data('userid');
        $('#blockUserId').val(userId);
        $('#blockReason').val('Account under review').removeClass('is-invalid');
        $('#blockUserModal').modal('show');
    });

    // Confirm block user from modal
    $('#confirmBlockUser').on('click', function() {
        const userId = $('#blockUserId').val();
        const reason = $('#blockReason').val().trim();

        // Validate reason is provided
        if (!reason) {
            $('#blockReason').addClass('is-invalid');
            toastr.error('Please provide a reason for blocking this user');
            return;
        }

        // Call backend API to block user
        $.ajax({
            url: `/videos/user/${userId}/block`,
            type: 'POST',
            data: { reason },
            success: function(response) {
                $('#blockUserModal').modal('hide');
                toastr.success('User blocked successfully');
                // Clear cache and reload videos to show blocked status
                allVideos = [];
                displayedVideoIds.clear();
                hideLoadMoreButton();
                $('#end-of-results').remove();
                loadVideos();
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Failed to block user';
                toastr.error(errorMsg);
                console.error('Block user error:', xhr);
            }
        });
    });

    // Unblock user - show modal
    $(document).on('click', '.unblock-user', function() {
        const userId = $(this).data('userid');
        $('#unblockUserId').val(userId);
        $('#unblockUserModal').modal('show');
    });

    // Confirm unblock user from modal
    $('#confirmUnblockUser').on('click', function() {
        const userId = $('#unblockUserId').val();

        // Call backend API to unblock user
        $.ajax({
            url: `/videos/user/${userId}/unblock`,
            type: 'POST',
            success: function(response) {
                $('#unblockUserModal').modal('hide');
                toastr.success('User unblocked successfully');
                // Clear cache and reload videos to remove blocked status
                allVideos = [];
                displayedVideoIds.clear();
                hideLoadMoreButton();
                $('#end-of-results').remove();
                loadVideos();
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Failed to unblock user';
                toastr.error(errorMsg);
                console.error('Unblock user error:', xhr);
            }
        });
    });

    // Initialize - load videos on page load
    loadVideos();

    // View all reports functionality
    $(document).on('click', '.view-reports', function() {
        const reports = JSON.parse($(this).attr('data-reports'));
        const videoId = $(this).data('video-id');
        
        let reportsHtml = '<div class="list-group">';
        
        reports.forEach((reporter, index) => {
            const reportDate = reporter.timestamp?._seconds
                ? new Date(reporter.timestamp._seconds * 1000).toLocaleString()
                : 'Unknown date';
            
            reportsHtml += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">
                            <span class="badge bg-warning text-dark me-2">#${index + 1}</span>
                            ${reporter.name}
                        </h6>
                        <small class="text-muted">${reportDate}</small>
                    </div>
                    <p class="mb-1"><strong>Reason:</strong> ${reporter.reason}</p>
                    <small class="text-muted">
                        <i class="fas fa-envelope me-1"></i> ${reporter.email}
                    </small>
                </div>
            `;
        });
        
        reportsHtml += '</div>';
        reportsHtml += `
            <div class="alert alert-info mt-3 mb-0">
                <strong>Total Reports:</strong> ${reports.length}
            </div>
        `;
        
        $('#reportsListContainer').html(reportsHtml);
        $('#viewReportsModal').modal('show');
    });
});