class Dashboard extends Master {
    constructor() {
        super();
        // ANY constructor Logic applicable
        this.statCounts = document.querySelectorAll('.stat-count');
        this.ageCanvas = document.querySelector(".ageChart");
        this.growthCanvas = document.querySelector(".growthChart");
    }

    setUpDashboardUI() {
        this.statCounts?.forEach(el => {
            if (!el) return;
            __append_html(
                `<div class="d-flex justify-content-start align-items-center">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>`,
                el
            )
        });
    }

    applyNullToStatElements() {
        this.statCounts?.forEach(el => {
            if (!el) return;
            __append_html(0, el)
        });
    }

    async getCardStats() {
        const res = await fetch('/dashboard/stats', {
            credentials: 'include',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!res.ok) {
            this.applyNullToStatElements();
        }

        let stats = await res.json();

        stats = stats?.data || [];

        stats.forEach(stat => {
            this.statCounts?.forEach(el => {
                if (!el) return;
                let dataId = el.getAttribute('data-id');
                if (dataId == stat.name) {
                    __append_html(stat.value, el)
                }
            });
        });
    }

    async drawAgeDemographics() { 
        if (typeof Chart === "undefined") {
            console.warn("Chart.js is not available");
            return;
        }
    
        const ageCanvas = this.ageCanvas;
        if (!ageCanvas) {
            console.warn("Age demographics canvas element not found");
            return;
        }
    
        try {
            const ctx = ageCanvas.getContext("2d");
            if (!ctx) {
                throw new Error("Could not get 2D context for age demographics");
            }
            
            if (this.ageChartInstance) {
                this.ageChartInstance.destroy();
            }
    
            this.ageChartInstance = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: [
                        "18-24 years (25%)",
                        "25-34 years (35%)", 
                        "35-44 years (20%)",
                        "45-50 years (12%)",
                        "51+ years (8%)"
                    ],
                    datasets: [{
                        data: [25, 35, 20, 12, 8],
                        backgroundColor: [
                            "#ff6b6b",
                            "#ff4c4c",
                            "#b33c3c",
                            "#ff8e8e",
                            "#4d1a1a"
                        ],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                        hoverBorderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                padding: 15,
                                font: {
                                    size: 11,
                                    weight: '500'
                                },
                                color: '#333'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    return `${label.split(' (')[0]}: ${value}%`;
                                }
                            }
                        },
                        title: {
                            display: true, 
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    }, 
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
    
            return this.ageChartInstance;
    
        } catch (error) {
            console.error("Error creating age demographics chart:", error);
            throw error;
        }
    }

    async drawGrowthChart() { 
        if (typeof Chart === "undefined") {
            console.warn("Chart.js is not available");
            return;
        }
    
        const growthCanvas = this.growthCanvas;
        if (!growthCanvas) {
            console.warn("Growth canvas element not found");
            return;
        }
    
        try {
            const ctx = growthCanvas.getContext("2d");
            if (!ctx) {
                throw new Error("Could not get 2D context");
            }
            
            if (this.growthChartInstance) {
                this.growthChartInstance.destroy();
            }
    
            this.growthChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    datasets: [{
                        label: "Market Size",
                        data: [100, 150, 140, 160, 190, 220, 250],
                        borderColor: "#ff4c4c",
                        backgroundColor: "rgba(255, 76, 76, 0.3)",
                        tension: 0.3,
                        fill: true,
                        pointStyle: "circle",
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: "#ff4c4c",
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 300,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    }
                }
            });
    
            return this.growthChartInstance;
    
        } catch (error) {
            console.error("Error creating growth chart:", error);
            throw error;
        }
    }


    getListOfTopOfFollowedUsers() { 
        $('.followed-users-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            // ajax: ajaxDtParser(
            //     'GET', 
            //     '/followers/top/followed', 
            //     filtersParser('.followedUsersFilters')
            // ), 
            fnDrawCallback: () => {
                const inst = new Dashboard();
                inst.actionOnFollowedUsersRes();
                watchFilterChanges('.followed-users-filters', inst.getListOfTopOfFollowedUsers.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    getListOfPromotedUsersAccounts() { 
        $('.promoted-users-accounts-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            // ajax: ajaxDtParser(
            //     'GET', 
            //     '/accounts/promoted', 
            //     filtersParser('.promotedUsersAccountsFilters')
            // ), 
            fnDrawCallback: () => {
                const inst = new Dashboard();
                inst.actionOnpromotedUsersAccountsRes();
                watchFilterChanges('.promoted-users-accounts-filters', inst.getListOfPromotedUsersAccounts.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnFollowedUsersRes() {
        // ...
    }

    actionOnpromotedUsersAccountsRes() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new Dashboard();
    inst.setUpDashboardUI();
    inst.getCardStats();
    inst.drawAgeDemographics();
    inst.drawGrowthChart();
    inst.getListOfTopOfFollowedUsers();
    inst.getListOfPromotedUsersAccounts();
});