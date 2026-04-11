module.exports = {
  apps : [{
    name   : "crawler",
    script : "./packages/app/dist/src/index.js",
    max_memory_restart : "512M",
    kill_timeout : 10000,
  }]
}
