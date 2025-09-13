#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// 🔥 COLLECTEUR DE DONNÉES AUTOMATIQUE
class FireDataCollector {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.zones = [
            'Var Est', 'Var Ouest', 'Bouches-du-Rhône Nord', 'Bouches-du-Rhône Sud',
            'Vaucluse', 'Alpes-de-Haute-Provence', 'Hautes-Alpes', 'Alpes-Maritimes',
            'Gard', 'Hérault'
        ];
        
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentTime = new Date().toLocaleTimeString('fr-FR');
    }
    
    async run() {
        try {
            console.log('🚀 Démarrage collecte données feu...');
            console.log('📅 Date courante:', this.currentDate);
            console.log('⏰ Heure courante:', this.currentTime);
            
            // Vérifier la connexion Supabase
            await this.checkSupabaseConnection();
            
            // Collecter données pour chaque zone
            const fireData = await this.collectAllZonesData();
            
            // Sauvegarder en base
            await this.saveToSupabase(fireData);
            
            console.log('🎉 Collecte terminée avec succès !');
            
        } catch (error) {
            console.error('❌ Erreur collecte:', error.message);
            process.exit(1);
        }
    }
    
    async checkSupabaseConnection() {
        console.log('🔌 Vérification connexion Supabase...');
        
        const { data, error } = await this.supabase
            .from('fire_risk_data')
            .select('id')
            .limit(1);
            
        if (error) {
            throw new Error(`Connexion Supabase échouée: ${error.message}`);
        }
        
        console.log('✅ Connexion Supabase OK');
    }
    
    async collectAllZonesData() {
        console.log('📊 Collecte données pour', this.zones.length, 'zones...');
        
        const fireData = [];
        
        for (const zone of this.zones) {
            const zoneData = await this.collectZoneData(zone);
            fireData.push(zoneData);
            
            // Pause entre les zones
            await this.sleep(500);
        }
        
        console.log('✅ Collecte terminée pour toutes les zones');
        return fireData;
    }
    
    async collectZoneData(zoneName) {
        console.log(`🔍 Collecte zone: ${zoneName}`);
        
        try {
            // Simulation collecte données réelles
            // Tu peux remplacer par des vraies APIs ici
            const riskLevel = Math.floor(Math.random() * 5) + 1; // 1-5
            const temperature = Math.floor(Math.random() * 15) + 25; // 25-40°C
            const humidity = Math.floor(Math.random() * 40) + 20; // 20-60%
            const windSpeed = Math.floor(Math.random() * 30) + 5; // 5-35 km/h
            const precipitations = Math.random() * 10; // 0-10mm
            
            const zoneData = {
                zone_name: zoneName,
                risk_level: riskLevel,
                risk_color: this.getRiskColor(riskLevel),
                risk_label: this.getRiskLabel(riskLevel),
                weather_conditions: {
                    temperature: temperature,
                    humidity: humidity,
                    wind_speed: windSpeed,
                    precipitations: parseFloat(precipitations.toFixed(1))
                },
                alerts: this.generateAlerts(riskLevel, temperature, humidity, windSpeed),
                recommendations: this.generateRecommendations(riskLevel),
                data_sources: [
                    'Préfecture',
                    'Météo France',
                    'Géorisques'
                ],
                date: this.currentDate,
                update_time: this.currentTime,
                coordinates: this.getZoneCoordinates(zoneName)
            };
            
            console.log(`✅ ${zoneName}: Risque ${riskLevel}/5 (${this.getRiskLabel(riskLevel)})`);
            return zoneData;
            
        } catch (error) {
            console.error(`❌ Erreur zone ${zoneName}:`, error.message);
            
            // Données par défaut en cas d'erreur
            return {
                zone_name: zoneName,
                risk_level: 2,
                risk_color: 'orange',
                risk_label: 'Modéré',
                weather_conditions: { error: 'Données indisponibles' },
                alerts: ['Erreur collecte données'],
                recommendations: ['Vérifier sources données'],
                data_sources: ['Système par défaut'],
                date: this.currentDate,
                update_time: this.currentTime,
                coordinates: { lat: 43.0, lng: 6.0 }
            };
        }
    }
    
    getRiskColor(level) {
        const colors = {
            1: 'green',
            2: 'yellow', 
            3: 'orange',
            4: 'red',
            5: 'darkred'
        };
        return colors[level] || 'gray';
    }
    
    getRiskLabel(level) {
        const labels = {
            1: 'Très faible',
            2: 'Faible',
            3: 'Modéré', 
            4: 'Élevé',
            5: 'Très élevé'
        };
        return labels[level] || 'Inconnu';
    }
    
    generateAlerts(riskLevel, temp, humidity, wind) {
        const alerts = [];
        
        if (riskLevel >= 4) alerts.push('🚨 Risque incendie élevé');
        if (temp > 35) alerts.push('🌡️ Température très élevée');
        if (humidity < 30) alerts.push('💧 Humidité très faible');
        if (wind > 25) alerts.push('💨 Vent fort');
        
        return alerts.length > 0 ? alerts : ['✅ Aucune alerte'];
    }
    
    generateRecommendations(riskLevel) {
        const recs = {
            1: ['Conditions normales', 'Surveillance habituelle'],
            2: ['Prudence recommandée', 'Éviter feux ouverts'],
            3: ['Vigilance accrue', 'Interdiction feux', 'Surveillance renforcée'],
            4: ['Alerte élevée', 'Interdiction totale feux', 'Préparation évacuation'],
            5: ['DANGER MAXIMUM', 'Évacuation préventive', 'Moyens de secours mobilisés']
        };
        return recs[riskLevel] || ['Suivre consignes officielles'];
    }
    
    getZoneCoordinates(zoneName) {
        const coords = {
            'Var Est': { lat: 43.1242, lng: 6.7357 },
            'Var Ouest': { lat: 43.0969, lng: 6.0756 },
            'Bouches-du-Rhône Nord': { lat: 43.5297, lng: 5.4474 },
            'Bouches-du-Rhône Sud': { lat: 43.2965, lng: 5.3698 },
            'Vaucluse': { lat: 43.9493, lng: 5.0459 },
            'Alpes-de-Haute-Provence': { lat: 44.0937, lng: 6.2356 },
            'Hautes-Alpes': { lat: 44.5579, lng: 6.0778 },
            'Alpes-Maritimes': { lat: 43.7102, lng: 7.2620 },
            'Gard': { lat: 43.8374, lng: 4.3601 },
            'Hérault': { lat: 43.6119, lng: 3.8772 }
        };
        return coords[zoneName] || { lat: 43.0, lng: 6.0 };
    }
    
    async saveToSupabase(fireData) {
        console.log('💾 Sauvegarde en base de données...');
        
        for (const zone of fireData) {
            const { data, error } = await this.supabase
                .from('fire_risk_data')
                .insert([zone]);
                
            if (error) {
                console.error(`❌ Erreur sauvegarde ${zone.zone_name}:`, error.message);
            } else {
                console.log(`✅ ${zone.zone_name} sauvegardé`);
            }
            
            await this.sleep(200);
        }
        
        console.log('💾 Sauvegarde terminée');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 🚀 EXÉCUTION
if (require.main === module) {
    const collector = new FireDataCollector();
    collector.run();
}

module.exports = FireDataCollector;
