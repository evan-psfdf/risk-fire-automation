#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 📊 GÉNÉRATEUR DE DONNÉES STATIQUES
class StaticDataGenerator {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        
        this.currentDate = new Date().toISOString().split('T')[0];
        this.publicDir = path.join(__dirname, '..', 'public');
        this.dataDir = path.join(this.publicDir, 'data');
    }
    
    async run() {
        try {
            console.log('📊 Génération fichier JSON statique...');
            console.log('📅 Date:', this.currentDate);
            
            // Créer dossiers si nécessaire
            await this.ensureDirectories();
            
            // Récupérer données Supabase
            const fireData = await this.getFireDataFromSupabase();
            
            // Générer JSON avec statistiques
            const jsonData = await this.generateJsonWithStats(fireData);
            
            // Sauvegarder fichier
            await this.saveJsonFile(jsonData);
            
            // Générer fichier de backup
            await this.saveBackupFile(jsonData);
            
            console.log('✅ Génération JSON terminée !');
            
        } catch (error) {
            console.error('❌ Erreur génération:', error.message);
            
            // Générer JSON avec données par défaut
            await this.generateFallbackJson();
            process.exit(1);
        }
    }
    
    async ensureDirectories() {
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        console.log('📁 Dossiers créés/vérifiés');
    }
    
    async getFireDataFromSupabase() {
        console.log('🔍 Récupération données Supabase...');
        
        const { data, error } = await this.supabase
            .from('fire_risk_data')
            .select('*')
            .eq('date', this.currentDate)
            .order('update_time', { ascending: false });
            
        if (error) {
            throw new Error(`Erreur Supabase: ${error.message}`);
        }
        
        console.log('✅ Données récupérées:', data?.length || 0, 'enregistrements');
        return data || [];
    }
    
    async generateJsonWithStats(fireData) {
        console.log('📊 Calcul statistiques...');
        
        const stats = this.calculateStats(fireData);
        const lastUpdate = fireData.length > 0 ? 
            fireData[0].update_time : 
            new Date().toLocaleTimeString('fr-FR');
            
        const jsonData = {
            success: true,
            message: 'Données générées automatiquement par GitHub Actions',
            data: fireData,
            stats: stats,
            meta: {
                generated_at: new Date().toISOString(),
                generated_by: 'GitHub Actions',
                date: this.currentDate,
                last_update: lastUpdate,
                total_records: fireData.length,
                data_source: 'supabase',
                version: '1.0.0'
            }
        };
        
        console.log('📊 Statistiques calculées:', JSON.stringify(stats, null, 2));
        return jsonData;
    }
    
    calculateStats(data) {
        if (!data || data.length === 0) {
            return {
                total_zones: 0,
                high_risk_zones: 0,
                average_risk: '0.0',
                risk_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                status: 'no_data'
            };
        }
        
        const riskLevels = data.map(zone => zone.risk_level);
        const highRiskZones = riskLevels.filter(level => level >= 4).length;
        const averageRisk = (riskLevels.reduce((sum, level) => sum + level, 0) / riskLevels.length).toFixed(1);
        
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        riskLevels.forEach(level => {
            if (distribution[level] !== undefined) {
                distribution[level]++;
            }
        });
        
        return {
            total_zones: data.length,
            high_risk_zones: highRiskZones,
            average_risk: averageRisk,
            risk_distribution: distribution,
            status: highRiskZones > 3 ? 'alert' : highRiskZones > 1 ? 'warning' : 'normal'
        };
    }
    
    async saveJsonFile(jsonData) {
        const filePath = path.join(this.dataDir, 'fire-data.json');
        
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
        
        const fileSizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);
        console.log('💾 Fichier sauvegardé:', filePath);
        console.log('📏 Taille fichier:', fileSizeKB, 'KB');
    }
    
    async saveBackupFile(jsonData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.dataDir, `backup-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
        console.log('📦 Backup sauvegardé:', backupPath);
    }
    
    async generateFallbackJson() {
        console.log('🆘 Génération JSON de secours...');
        
        const fallbackData = {
            success: false,
            message: 'Données indisponibles - Fichier de secours',
            data: [],
            stats: {
                total_zones: 0,
                high_risk_zones: 0,
                average_risk: '0.0',
                status: 'error'
            },
            meta: {
                generated_at: new Date().toISOString(),
                generated_by: 'GitHub Actions (Fallback)',
                date: this.currentDate,
                error: true
            }
        };
        
        await this.ensureDirectories();
        await this.saveJsonFile(fallbackData);
        
        console.log('🆘 JSON de secours généré');
    }
}

// 🚀 EXÉCUTION
if (require.main === module) {
    const generator = new StaticDataGenerator();
    generator.run();
}

module.exports = StaticDataGenerator;
