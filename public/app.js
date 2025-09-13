// 🔥 APPLICATION RISQUE INCENDIE - GITHUB PAGES VERSION
class FireRiskApp {
    constructor() {
        this.data = [];
        this.isProduction = window.location.hostname.includes('github.io');
        console.log('🔥 Fire Risk App - GitHub Pages Edition');
        console.log('🌍 Mode:', this.isProduction ? 'PRODUCTION (GitHub Pages)' : 'LOCAL');
        this.init();
    }
    
    async init() {
        console.log('🚀 Initialisation de l\'application');
        await this.loadData();
        this.setupAutoRefresh();
    }
    
    async loadData() {
        try {
            console.log('📡 Chargement des données statiques...');
            this.showLoading();
            
            // 📄 Lire le fichier JSON statique généré par GitHub Actions
            const response = await fetch('./data/fire-data.json?t=' + Date.now());
            
            if (!response.ok) {
                throw new Error(`Fichier JSON non trouvé: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📥 Données reçues:', result);
            
            if (result.success && result.data && result.data.length > 0) {
                this.data = result.data;
                this.renderData();
                this.updateStats(result.stats);
                this.updateSystemStatus('operational', result.meta);
                this.hideLoading();
                console.log('✅ Données chargées:', this.data.length, 'zones');
            } else if (result.data && result.data.length === 0) {
                console.log('⚠️ Aucune donnée disponible pour aujourd\'hui');
                this.showNoData();
                this.updateSystemStatus('no_data');
                this.hideLoading();
            } else {
                throw new Error('Structure JSON invalide');
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
            await this.loadDemoData();
            this.updateSystemStatus('error', null, error.message);
        }
    }
    
    showNoData() {
        const container = document.getElementById('zones-container');
        container.innerHTML = `
            <div class="no-data">
                <h3>📅 Aucune donnée disponible</h3>
                <p>Les données pour aujourd'hui n'ont pas encore été collectées.</p>
                <p>⏰ Prochaine mise à jour automatique : 9h, 12h ou 17h30</p>
                <button onclick="window.location.reload()" class="btn-refresh">
                    🔄 Actualiser la page
                </button>
            </div>
        `;
    }
    
    async loadDemoData() {
        console.log('🎭 Chargement données de démonstration...');
        
        this.data = [
            {
                zone_name: 'Var Est',
                risk_level: 3,
                risk_color: 'orange',
                risk_label: 'Modéré',
                weather_conditions: { temperature: 28, humidity: 45, wind_speed: 15 },
                alerts: ['Prudence recommandée'],
                recommendations: ['Éviter feux ouverts'],
                update_time: '12:00:00'
            },
            {
                zone_name: 'Var Ouest', 
                risk_level: 4,
                risk_color: 'red',
                risk_label: 'Élevé',
                weather_conditions: { temperature: 32, humidity: 35, wind_speed: 20 },
                alerts: ['🚨 Risque incendie élevé'],
                recommendations: ['Interdiction feux', 'Surveillance renforcée'],
                update_time: '12:00:00'
            },
            {
                zone_name: 'Bouches-du-Rhône',
                risk_level: 2,
                risk_color: 'yellow', 
                risk_label: 'Faible',
                weather_conditions: { temperature: 26, humidity: 55, wind_speed: 10 },
                alerts: ['✅ Aucune alerte'],
                recommendations: ['Surveillance habituelle'],
                update_time: '12:00:00'
            }
        ];
        
        this.renderData();
        this.updateStats({
            total_zones: 3,
            high_risk_zones: 1,
            average_risk: '3.0',
            status: 'demo'
        });
        this.hideLoading();
        
        console.log('🎭 Données de démo chargées');
    }
    
    renderData() {
        const container = document.getElementById('zones-container');
        
        if (!this.data || this.data.length === 0) {
            this.showNoData();
            return;
        }
        
        container.innerHTML = this.data.map(zone => `
            <div class="zone-card risk-${zone.risk_level}">
                <div class="zone-header">
                    <h3>${zone.zone_name}</h3>
                    <div class="risk-badge risk-${zone.risk_level}">
                        ${zone.risk_level}/5 - ${zone.risk_label}
                    </div>
                </div>
                
                <div class="zone-details">
                    ${zone.weather_conditions && !zone.weather_conditions.error ? `
                        <div class="weather-info">
                            🌡️ ${zone.weather_conditions.temperature}°C
                            💧 ${zone.weather_conditions.humidity}%
                            💨 ${zone.weather_conditions.wind_speed} km/h
                        </div>
                    ` : '<div class="weather-info">⚠️ Données météo indisponibles</div>'}
                    
                    <div class="alerts">
                        <strong>🚨 Alertes :</strong>
                        <ul>
                            ${zone.alerts.map(alert => `<li>${alert}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="recommendations">
                        <strong>📋 Recommandations :</strong>
                        <ul>
                            ${zone.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="update-time">
                        ⏰ Mis à jour à ${zone.update_time}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateStats(stats) {
        if (!stats) return;
        
        document.getElementById('stat-zones').textContent = stats.total_zones || 0;
        document.getElementById('stat-high-risk').textContent = stats.high_risk_zones || 0;
        document.getElementById('stat-avg-risk').textContent = stats.average_risk || '0.0';
        
        const lastUpdateElement = document.getElementById('stat-last-update');
        if (this.data && this.data.length > 0) {
            lastUpdateElement.textContent = this.data[0].update_time || 'Inconnue';
        } else {
            lastUpdateElement.textContent = 'Aucune donnée';
        }
    }
    
    updateSystemStatus(status, meta = null, errorMsg = null) {
        const statusElement = document.getElementById('system-status');
        
        const statusMessages = {
            operational: '🟢 Opérationnel - Données à jour',
            no_data: '🟡 En attente - Prochaine mise à jour programmée',
            error: '🔴 Erreur - Données de démonstration affichées',
            demo: '🎭 Mode démonstration'
        };
        
        statusElement.innerHTML = `
            <div class="status-${status}">
                ${statusMessages[status] || '⚪ Statut inconnu'}
                ${meta ? `<small><br>📅 Généré le ${new Date(meta.generated_at).toLocaleString('fr-FR')}</small>` : ''}
                                ${errorMsg ? `<small><br>❌ ${errorMsg}</small>` : ''}
            </div>
        `;
    }
    
    showLoading() {
        document.getElementById('zones-container').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>🔄 Chargement des données en cours...</p>
            </div>
        `;
    }
    
    hideLoading() {
        // Le loading sera remplacé par renderData() ou showNoData()
    }
    
    setupAutoRefresh() {
        // Actualisation automatique toutes les 5 minutes
        setInterval(() => {
            console.log('🔄 Actualisation automatique...');
            this.loadData();
        }, 5 * 60 * 1000);
        
        // Actualisation au focus de la page
        window.addEventListener('focus', () => {
            console.log('👁️ Page refocusée - Actualisation...');
            this.loadData();
        });
    }
}

// 🚀 Démarrage automatique de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.fireRiskApp = new FireRiskApp();
});

// Export pour tests (si besoin)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FireRiskApp;
}

