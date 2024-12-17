const DelayNamespace = {
    delay(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }
}

module.exports = DelayNamespace;
