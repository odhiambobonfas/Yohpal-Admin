$(document).ready(function() {
    let currentFilter = 'all';
    let videosTable;

    // Initialize DataTable
    function initTable() {
        if (videosTable) {
            videosTable.destroy();
        }

        videosTable = $('#videos-table').DataTable({
            processing: true,
            serverSide: false,
            ajax: {
                url: '/videos',
                type: 'GET',
                data: { flagged: currentFilter === 'all' ? null : currentFilter },
                dataSrc: 'data'
            },
            columns: [
                { data: 'url' },
                { data: 'uploaderName' },
                { data: 'createdAt' },
                { data: 'flagged' },
                { data: 'actions' }
            ],
            order: [[2, 'desc']]
        });
    }

    // Filter buttons
    $('.filter-btn').on('click', function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        initTable();
    });

    // Flag video
    $(document).on('click', '.flag-video', function() {
        const videoId = $(this).data('id');
        $('#flagVideoId').val(videoId);
        $('#flagModal').modal('show');
    });

    $('#confirmFlag').on('click', function() {
        const videoId = $('#flagVideoId').val();
        const reason = $('#flagReason').val();

        $.ajax({
            url: `/videos/${videoId}/flag`,
            type: 'POST',
            data: { reason },
            success: function(response) {
                $('#flagModal').modal('hide');
                $('#flagReason').val('');
                toastr.success(response.message || 'Video flagged successfully');
                videosTable.ajax.reload();
            },
            error: function(xhr) {
                toastr.error(xhr.responseJSON?.message || 'Failed to flag video');
            }
        });
    });

    // Unflag video
    $(document).on('click', '.unflag-video', function() {
        const videoId = $(this).data('id');
        
        if (confirm('Are you sure you want to unflag this video?')) {
            $.ajax({
                url: `/videos/${videoId}/unflag`,
                type: 'POST',
                success: function(response) {
                    toastr.success(response.message || 'Video unflagged successfully');
                    videosTable.ajax.reload();
                },
                error: function(xhr) {
                    toastr.error(xhr.responseJSON?.message || 'Failed to unflag video');
                }
            });
        }
    });

    // Initialize on page load
    initTable();
});
