const LiveMod = (function() {
    
    // Helper function to format duration
    function formatDuration(minutes) {
        if (!minutes || minutes < 0) return '0m';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }

    // Helper function to format date/time
    function formatDateTime(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return {
        init: function() {
            this.initActiveSessions();
            this.initHistorySessions();
        },

        initActiveSessions: function() {
            if (!$('.active-sessions-table').length) return;
            
            const activeTable = $('.active-sessions-table').DataTable({
                processing: true,
                serverSide: true,
                ajax: {
                    url: '/live/api/active',
                    type: 'GET'
                },
                columns: [
                    {
                        data: 'hostUserName',
                        name: 'host',
                        render: function(data, type, row) {
                            const avatar = row.hostAvatar || '/store/images/avatars/default-avatar.jpg';
                            return `
                                <div class="d-flex align-items-center">
                                    <img src="${avatar}" 
                                         class="rounded-circle me-2 live-avatar" 
                                         width="32" 
                                         height="32" 
                                         onerror="this.src='/store/images/avatars/default-avatar.jpg'">
                                    <div>
                                        <strong>${data || 'Unknown'}</strong>
                                    </div>
                                </div>
                            `;
                        }
                    },
                    {
                        data: 'durationMinutes',
                        name: 'duration',
                        render: function(data, type, row) {
                            return `<span class="badge bg-info">${formatDuration(data)}</span>`;
                        }
                    },
                    {
                        data: 'totalAudienceCount',
                        name: 'viewers',
                        render: function(data, type, row) {
                            return `<span class="badge bg-success">${data || 0}</span>`;
                        }
                    },
                    {
                        data: 'coHostsCount',
                        name: 'coHosts',
                        render: function(data, type, row) {
                            return data || 0;
                        }
                    },
                    {
                        data: 'roomID',
                        name: 'roomID',
                        render: function(data, type, row) {
                            return `<code class="small">${data || 'N/A'}</code>`;
                        }
                    },
                    {
                        data: 'startTime',
                        name: 'startTime',
                        render: function(data, type, row) {
                            return formatDateTime(data);
                        }
                    }
                ],
                order: [[5, 'desc']], 
                pageLength: 10,
                lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
                language: {
                    processing: '<i class="fa fa-spinner fa-spin fa-2x"></i> Loading...',
                    emptyTable: 'No active live sessions',
                    zeroRecords: 'No active live sessions found'
                }
            });

            setInterval(function() {
                activeTable.ajax.reload(null, false);
            }, 30000);
        },

        initHistorySessions: function() {
            if (!$('.history-sessions-table').length) return;

            const historyTable = $('.history-sessions-table').DataTable({
                processing: true,
                serverSide: true,
                ajax: {
                    url: '/live/api/history',
                    type: 'GET',
                    data: function(d) {
                        d.daterange = $('#daterange').val();
                    }
                },
                columns: [
                    {
                        data: 'hostUserName',
                        name: 'host',
                        render: function(data, type, row) {
                            const avatar = row.hostAvatar || '/store/images/avatars/default-avatar.jpg';
                            return `
                                <div class="d-flex align-items-center">
                                    <img src="${avatar}" 
                                         class="rounded-circle me-2 live-avatar" 
                                         width="32" 
                                         height="32" 
                                         onerror="this.src='/store/images/avatars/default-avatar.jpg'">
                                    <div>
                                        <strong>${data || 'Unknown'}</strong>
                                    </div>
                                </div>
                            `;
                        }
                    },
                    {
                        data: 'durationMinutes',
                        name: 'duration',
                        render: function(data, type, row) {
                            return `<span class="badge bg-secondary">${formatDuration(data)}</span>`;
                        }
                    },
                    {
                        data: 'totalAudienceCount',
                        name: 'viewers',
                        render: function(data, type, row) {
                            return `<span class="badge bg-primary">${data || 0}</span>`;
                        }
                    },
                    {
                        data: 'coHostsCount',
                        name: 'coHosts',
                        render: function(data, type, row) {
                            return data || 0;
                        }
                    },
                    {
                        data: 'startTime',
                        name: 'startTime',
                        render: function(data, type, row) {
                            return formatDateTime(data);
                        }
                    },
                    {
                        data: 'endTime',
                        name: 'endTime',
                        render: function(data, type, row) {
                            return formatDateTime(data);
                        }
                    },
                    {
                        data: 'status',
                        name: 'status',
                        render: function(data, type, row) {
                            const statusClass = data === 'ended' ? 'success' : 'warning';
                            return `<span class="badge bg-${statusClass}">${data || 'ended'}</span>`;
                        }
                    }
                ],
                order: [[5, 'desc']],
                pageLength: 10,
                lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
                language: {
                    processing: '<i class="fa fa-spinner fa-spin fa-2x"></i> Loading...',
                    emptyTable: 'No live session history',
                    zeroRecords: 'No sessions found for the selected filters'
                }
            });

            $('#daterange').daterangepicker({
                autoUpdateInput: false,
                locale: { cancelLabel: 'Clear', format: 'YYYY-MM-DD' }
            });

            $('#daterange').on('apply.daterangepicker', function(ev, picker) {
                $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
            });

            $('#daterange').on('cancel.daterangepicker', function(ev, picker) {
                $(this).val('');
            });

            $('#filterBtn').on('click', function() { historyTable.ajax.reload(); });
            $('#clearBtn').on('click', function() { $('#daterange').val(''); historyTable.ajax.reload(); });
        },

        initAnalytics: function() {
            const self = this;
            $.ajax({
                url: '/live/api/analytics',
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        const data = response.data;

                        // Populate stats
                        $('#stat-total-airtime').text(formatDuration(data.stats.totalAirtime));
                        $('#stat-avg-length').text(formatDuration(data.stats.avgLength));
                        $('#stat-avg-attendees').text(data.stats.avgAttendees);
                        $('#stat-total-sessions').text(data.stats.totalSessions);

                        // Populate Top Streamer Card
                        if (data.topStreamer) {
                            const totalMinutes = Math.floor(data.stats.totalAirtime * (data.topStreamer.streamCount / data.stats.totalSessions));
                            $('#container-top-streamer').html(`
                                <div class="analytics-card-title">Most Active Host</div>
                                <div class="analytics-card-main">
                                    <img src="${data.topStreamer.avatar}" class="analytics-card-avatar" onerror="this.src='/store/images/avatars/default-avatar.jpg'">
                                    <div class="analytics-card-username">${data.topStreamer.userName}</div>
                                    <div class="analytics-card-subtitle">Top Contributor</div>
                                </div>
                                <div class="analytics-card-stats">
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${data.topStreamer.streamCount}</div>
                                        <div class="analytics-card-stat-label">Streams</div>
                                    </div>
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${formatDuration(totalMinutes)}</div>
                                        <div class="analytics-card-stat-label">Airtime</div>
                                    </div>
                                </div>
                            `);
                        } else {
                            $('#container-top-streamer').html(`
                                <div class="analytics-card-title">Most Active Host</div>
                                <div class="text-center text-muted py-4">
                                    <i class="fas fa-inbox fa-2x mb-2 opacity-25"></i>
                                    <p class="small mb-0">No data available</p>
                                </div>
                            `);
                        }

                        // Populate Peak Session Card
                        if (data.peakSession) {
                            const duration = data.peakSession.endTime && data.peakSession.startTime
                                ? Math.floor((new Date(data.peakSession.endTime) - new Date(data.peakSession.startTime)) / 60000)
                                : 0;
                            const coHosts = data.peakSession.coHostsCount || 0;

                            $('#container-peak-session').html(`
                                <div class="analytics-card-title">Peak Performance</div>
                                <div class="analytics-card-main">
                                    <img src="${data.peakSession.hostAvatar}" class="analytics-card-avatar" onerror="this.src='/store/images/avatars/default-avatar.jpg'">
                                    <div class="analytics-card-username">${data.peakSession.hostUserName}</div>
                                    <div class="analytics-card-subtitle">${data.peakSession.totalAudienceCount} Peak Viewers</div>
                                </div>
                                <div class="analytics-card-stats">
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${formatDuration(duration)}</div>
                                        <div class="analytics-card-stat-label">Duration</div>
                                    </div>
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${coHosts}</div>
                                        <div class="analytics-card-stat-label">Co-hosts</div>
                                    </div>
                                </div>
                            `);
                        } else {
                            $('#container-peak-session').html(`
                                <div class="analytics-card-title">Peak Performance</div>
                                <div class="text-center text-muted py-4">
                                    <i class="fas fa-inbox fa-2x mb-2 opacity-25"></i>
                                    <p class="small mb-0">No data available</p>
                                </div>
                            `);
                        }

                        // Populate Recently Live Card
                        if (data.latestStream) {
                            const isLive = data.latestStream.status !== 'ended';
                            const duration = data.latestStream.endTime && data.latestStream.startTime
                                ? Math.floor((new Date(data.latestStream.endTime) - new Date(data.latestStream.startTime)) / 60000)
                                : 0;
                            const viewers = data.latestStream.totalAudienceCount || 0;
                            const badge = isLive
                                ? '<span class="analytics-badge analytics-badge-live">Live Now</span>'
                                : '<span class="analytics-badge analytics-badge-ended">Ended</span>';

                            $('#container-latest-stream').html(`
                                <div class="analytics-card-title">Recently Live</div>
                                <div class="analytics-card-main">
                                    <img src="${data.latestStream.hostAvatar}" class="analytics-card-avatar" onerror="this.src='/store/images/avatars/default-avatar.jpg'">
                                    <div class="analytics-card-username">${data.latestStream.hostUserName}</div>
                                    <div class="analytics-card-subtitle">${formatDateTime(data.latestStream.startTime)}</div>
                                    <div class="mt-2">${badge}</div>
                                </div>
                                <div class="analytics-card-stats">
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${viewers}</div>
                                        <div class="analytics-card-stat-label">Viewers</div>
                                    </div>
                                    ${!isLive ? `
                                    <div class="analytics-card-stat">
                                        <div class="analytics-card-stat-value">${formatDuration(duration)}</div>
                                        <div class="analytics-card-stat-label">Duration</div>
                                    </div>` : ''}
                                </div>
                            `);
                        } else {
                            $('#container-latest-stream').html(`
                                <div class="analytics-card-title">Recently Live</div>
                                <div class="text-center text-muted py-4">
                                    <i class="fas fa-inbox fa-2x mb-2 opacity-25"></i>
                                    <p class="small mb-0">No data available</p>
                                </div>
                            `);
                        }
                    }
                }
            });

            // Fetch and populate active sessions count
            $.ajax({
                url: '/live/api/count/active',
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    const count = response.count || 0;
                    $('#container-active-now').html(`
                        <div class="analytics-card-title">Active Now</div>
                        <div class="analytics-card-main">
                            <div class="analytics-card-metric">${count}</div>
                            <div class="analytics-card-label">Live Sessions</div>
                            <div class="analytics-card-subtitle mt-2">
                                ${count === 0 ? 'No active streams' : count === 1 ? '1 host streaming' : count + ' hosts streaming'}
                            </div>
                        </div>
                    `);
                },
                error: function() {
                    $('#container-active-now').html(`
                        <div class="analytics-card-title">Active Now</div>
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-inbox fa-2x mb-2 opacity-25"></i>
                            <p class="small mb-0">Unable to load</p>
                        </div>
                    `);
                }
            });
        }
    };
})();

$(document).ready(function() {
    LiveMod.init();
});

window.LiveMod = LiveMod;
