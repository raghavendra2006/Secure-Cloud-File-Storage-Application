module.exports = {
    apps: [
        {
            name: 'securestore',
            script: 'server.js',
            instances: 'max',        // Use all CPU cores
            exec_mode: 'cluster',
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            time: true,
            restart_delay: 5000,
            max_restarts: 10,
        },
    ],
};
