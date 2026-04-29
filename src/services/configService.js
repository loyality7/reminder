const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ConfigService {
    constructor() {
        this.configPath = path.join(app.getPath('userData'), 'config.json');
    }

    load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                return config;
            } else {
                const defaultConfig = {
                    lastFilePath: null,
                    notificationsEnabled: true,
                    snoozedUntil: null
                };
                this.save(defaultConfig);
                return defaultConfig;
            }
        } catch (error) {
            console.error('Error loading config:', error);
            return {
                lastFilePath: null,
                notificationsEnabled: true,
                snoozedUntil: null
            };
        }
    }

    save(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }

    update(updates) {
        const current = this.load();
        const updated = { ...current, ...updates };
        this.save(updated);
        return updated;
    }
}

module.exports = ConfigService;
