var SOUND = {};


SOUND.init = function() {
    
    var soundIcon = document.getElementById('config-sound');

    if (soundIcon) {
        // Check state
        if (sessionStorage.sound == 'true') {
            soundIcon.classList.add('sound-enabled');
        }

        // event
        soundIcon.onclick = function() {
            soundIcon.classList.toggle('sound-enabled');
            sessionStorage.sound = soundIcon.classList.contains('sound-enabled');
        }
    }
}



window.addEventListener('load', SOUND.init, false);