module.exports = {
  apps: [{
    name: 'Cron',
    script: 'index.js',
    exec_mode: "cluster",
    autorestart: true
  }]
};