class Dashboard extends Master {
    constructor () {
        super();
        // ANY constructor Logic applicable
        this.statCounts = document.querySelectorAll('.stat-count');
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
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new Dashboard();
    inst.setUpDashboardUI();
    inst.getCardStats();
});