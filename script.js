// --- MODAL UI LOGIC ---
const modal = document.getElementById('lessonModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

function openLessonModal(title, desc) {
    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}

// Close modal if clicked outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}


// --- CORE AUDIO ENGINE ---
let audioContext;
let analyser;
let microphone;
let pitchDetectLoop;

async function startAudioEngine() {
    try {
        // 1. Initialize the Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 2. Request Microphone Access (raw audio, no echo cancellation)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
            } 
        });

        // 3. Create the Analyser Node
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; 
        
        // 4. Route the microphone into the analyser
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        console.log("Audio engine started successfully! The browser is listening.");
        
        // Update UI to show success
        const startBtn = document.querySelector('.btn-start');
        if(startBtn) {
            startBtn.innerText = "Microphone Connected!";
            startBtn.style.backgroundColor = "#00b894"; // success green
            startBtn.style.boxShadow = "none";
            startBtn.style.transform = "translateY(4px)";
        }
        
        // Close modal after a brief delay and trigger the pitch detection loop
        setTimeout(() => {
            closeModal();
            updatePitch(); 
        }, 1500);
        
    } catch (error) {
        console.error("Error accessing the microphone:", error);
        alert("Vocalify requires microphone access to hear you sing!");
    }
}


// --- PITCH DETECTION ALGORITHM ---

// Array of musical notes to map our math back to standard theory
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 1. The Auto-Correlation Math
function autoCorrelate(buf, sampleRate) {
    // First, check if the volume is loud enough (ignore background silence)
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // Volume too low, return -1 (no pitch detected)

    // Find the repeating wave pattern
    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buf[j] * buf[j + i];
        }
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

// 2. Frequency to Musical Note Converters
function noteFromPitch(frequency) {
    // Uses the standard A4 = 440Hz tuning formula
    let noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69; // 69 is MIDI note for A4
}

function frequencyFromNoteNumber(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

function centsOffFromPitch(frequency, note) {
    // Calculates how sharp or flat you are (in cents)
    return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
}

// 3. The Continuous Listening Loop
function updatePitch() {
    // Grab the raw audio data from the analyser
    let buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    // Run the math!
    let pitchInHz = autoCorrelate(buffer, audioContext.sampleRate);
    
    if (pitchInHz !== -1) {
        // Convert Hz to standard music theory
        let note = noteFromPitch(pitchInHz);
        let noteName = noteStrings[note % 12];
        let octave = Math.floor(note / 12) - 1;
        let cents = centsOffFromPitch(pitchInHz, note);
        
        // Print it to the browser console so we can see it working
        console.log(`Singing: ${noteName}${octave} | Frequency: ${Math.round(pitchInHz)}Hz | Cents Off: ${cents}`);
    }
    
    // Call this function again on the next animation frame (creating a rapid loop)
    pitchDetectLoop = requestAnimationFrame(updatePitch);
}
