/**
 * ChargedUP: Behind The Scenes of an RC Car
 * Physics Module - Motor & Magnetic Field Simulator
 * January 23, 2026
 * 
 * Implements magnetic field calculations, DC motor conceptual model,
 * and speed estimation with clear approximation disclaimers.
 */

window.ChargedUP = window.ChargedUP || {};

/* ============================================
   Physics Constants (with source citations)
   ============================================ */
const PHYSICS_CONSTANTS = {
    // Permeability of free space (NIST CODATA 2018)
    MU_0: 4 * Math.PI * 1e-7, // T×m/A ≈ 1.2566e-6

    // Relative permeability of common materials
    MU_R: {
        air: 1,
        ferrite: 2000,
        iron: 4000,
        steel: 4500
    },

    // Typical small DC motor parameters (educational approximations)
    MOTOR_DEFAULTS: {
        armatureResistance: 3, // Ω
        noLoadCurrent: 0.1, // A
        stallCurrent: 2, // A (at rated voltage)
        typicalRPM: 6000, // at no load
        coilTurns: 50
    }
};

/* ============================================
   Motor Presets
   ============================================ */
const MOTOR_PRESETS = {
    'small-dc-motor': {
        name: 'Small Brushed DC Motor (RC Toy)',
        armatureR: 3,
        coilTurns: 50,
        coilRadius: 0.01, // 1 cm
        coilLength: 0.02, // 2 cm
        ratedVoltage: 6,
        noLoadRPM: 6000,
        description: 'Typical motor found in small RC cars'
    },
    'hobby-motor': {
        name: 'Hobby Motor (540 size)',
        armatureR: 0.5,
        coilTurns: 30,
        coilRadius: 0.018,
        coilLength: 0.035,
        ratedVoltage: 7.2,
        noLoadRPM: 15000,
        description: 'Common in 1:10 scale RC vehicles'
    },
    'demo-solenoid': {
        name: 'Demo Coil/Solenoid',
        armatureR: 2,
        coilTurns: 100,
        coilRadius: 0.015,
        coilLength: 0.05,
        ratedVoltage: 6,
        noLoadRPM: null, // Not a rotating motor
        description: 'For magnetic field demonstration'
    }
};

/* ============================================
   Magnetic Field Calculator
   ============================================ */
class MagneticFieldCalculator {
    constructor() {
        this.constants = PHYSICS_CONSTANTS;
    }

    /**
     * Calculate B-field at center of a solenoid
     * Formula: B = μ₀ × μᵣ × N × I / L
     * 
     * @param {number} turns - Number of turns (N)
     * @param {number} current - Current in Amperes (I)
     * @param {number} length - Length in meters (L)
     * @param {string|number} material - Material name or μᵣ value
     * @returns {object} B-field results
     */
    computeBFieldSolenoid(turns, current, length, material = 'air') {
        const mu0 = this.constants.MU_0;
        const muR = typeof material === 'number'
            ? material
            : (this.constants.MU_R[material] || 1);

        const B = mu0 * muR * turns * current / length;

        return {
            B, // Tesla
            B_mT: B * 1000, // milliTesla
            B_uT: B * 1e6, // microTesla
            formula: 'B = μ₀ × μᵣ × N × I / L',
            inputs: { turns, current, length, muR },
            unit: 'T'
        };
    }

    /**
     * Calculate B-field at center of a single loop/coil
     * Formula: B ≈ μ₀ × N × I / (2 × r)
     * 
     * @param {number} turns - Number of turns (N)
     * @param {number} current - Current in Amperes (I)
     * @param {number} radius - Radius in meters (r)
     * @returns {object} B-field results
     */
    computeBFieldLoop(turns, current, radius) {
        const mu0 = this.constants.MU_0;
        const B = mu0 * turns * current / (2 * radius);

        return {
            B,
            B_mT: B * 1000,
            B_uT: B * 1e6,
            formula: 'B ≈ μ₀ × N × I / (2r)',
            inputs: { turns, current, radius },
            unit: 'T',
            note: 'Approximation valid at center of loop'
        };
    }

    /**
     * Calculate B-field around a straight wire
     * Formula: B = μ₀ × I / (2π × r)
     * 
     * @param {number} current - Current in Amperes (I)
     * @param {number} distance - Distance from wire in meters (r)
     * @returns {object} B-field results
     */
    computeBFieldWire(current, distance) {
        const mu0 = this.constants.MU_0;
        const B = mu0 * current / (2 * Math.PI * distance);

        return {
            B,
            B_mT: B * 1000,
            B_uT: B * 1e6,
            formula: 'B = μ₀ × I / (2πr)',
            inputs: { current, distance },
            unit: 'T',
            note: 'From Ampère\'s law for infinite straight wire'
        };
    }

    /**
     * Generate step-by-step work for solenoid calculation
     */
    generateWorkSteps(type, inputs, result) {
        const mu0 = this.constants.MU_0.toExponential(4);

        if (type === 'solenoid') {
            return `
        <div class="work-step">
          <span class="work-step__number">1</span>
          <div class="work-step__content">
            <strong>Identify known values:</strong>
            <p class="text-sm text-muted mb-sm">First, we gather all the information we need. Each variable affects the final magnetic field strength in a different way.</p>
            <p class="work-step__formula">N = ${inputs.turns} turns <span class="text-muted text-sm">(more turns = stronger field)</span></p>
            <p class="work-step__formula">I = ${inputs.current} A <span class="text-muted text-sm">(more current = stronger field)</span></p>
            <p class="work-step__formula">L = ${inputs.length} m <span class="text-muted text-sm">(longer coil = weaker field per unit length)</span></p>
            <p class="work-step__formula">μᵣ = ${inputs.muR} <span class="text-muted text-sm">(iron core multiplies field strength!)</span></p>
          </div>
        </div>
        
        <div class="work-step">
          <span class="work-step__number">2</span>
          <div class="work-step__content">
            <strong>Apply solenoid formula:</strong>
            <p class="text-sm text-muted mb-sm">This formula tells us the magnetic field strength inside a coil. μ₀ is the permeability of free space (a constant from nature). μᵣ accounts for the core material, iron has μᵣ of about 4000, making fields thousands of times stronger!</p>
            <p class="work-step__formula">B = μ₀ × μᵣ × N × I / L</p>
            <p class="text-sm text-muted mb-sm"> Field strength = (permeability) × (turns) × (current) ÷ (length)</p>
            <p class="work-step__formula">B = (${mu0}) × ${inputs.muR} × ${inputs.turns} × ${inputs.current} / ${inputs.length}</p>
          </div>
        </div>
        
        <div class="work-step">
          <span class="work-step__number">3</span>
          <div class="work-step__content">
            <strong>Calculate result:</strong>
            <p class="text-sm text-muted mb-sm">We get the answer in Tesla (T), the SI unit for magnetic field strength. Since motors typically have fields in the millitesla range, we also show the result in mT.</p>
            <p class="work-step__formula">B = <strong class="text-teal">${result.B.toExponential(4)} T</strong></p>
            <p class="work-step__formula">B = <strong class="text-cyan">${result.B_mT.toFixed(4)} mT</strong> (millitesla)</p>
            <p class="text-sm text-muted mt-sm">For comparison: Earth's magnetic field is about 0.025-0.065 mT. An MRI machine is about 1,500-3,000 mT!</p>
          </div>
        </div>
      `;
        }

        return '';
    }
}

/* ============================================
   Motor Speed Estimator (Conceptual Model)
   ============================================ */
class MotorSpeedEstimator {
    /**
     * IMPORTANT: This is a simplified educational model.
     * Real motor behavior depends on many factors not modeled here.
     * 
     * Simple proportional model:
     * Speed ≈ (V_applied - I × R_armature) / k
     * where k is the motor constant (approximated from no-load conditions)
     */

    constructor(preset = MOTOR_PRESETS['small-dc-motor']) {
        this.preset = preset;
        this.constants = PHYSICS_CONSTANTS.MOTOR_DEFAULTS;
    }

    /**
     * Calculate steady-state current given supply and motor resistance
     * I = V / (R_motor + R_internal)
     */
    computeLoadedCurrent(supplyVoltage, motorR, internalR = 0) {
        const totalR = motorR + internalR;
        if (totalR <= 0) return { current: 0, note: 'Invalid resistance' };

        const current = supplyVoltage / totalR;

        return {
            current,
            supplyVoltage,
            motorR,
            internalR,
            totalR,
            powerMotor: current * current * motorR,
            powerLoss: current * current * internalR,
            note: 'Simplified steady-state model (ignores back-EMF at startup)'
        };
    }

    /**
     * Estimate motor speed from current (proportional model)
     * 
     * This is a SIMPLIFIED educational approximation:
     * - At no-load, motor spins at max RPM with minimal current
     * - At stall, motor has zero RPM and maximum current
     * - Linear interpolation in between
     * 
     * DISCLAIMER: Actual motor behavior is more complex and depends
     * on load, back-EMF, magnetic saturation, friction, etc.
     */
    estimateSpeed(current, supplyVoltage) {
        const noLoadRPM = this.preset.noLoadRPM;
        const ratedVoltage = this.preset.ratedVoltage;
        const armatureR = this.preset.armatureR;

        if (!noLoadRPM) {
            return { rpm: null, note: 'Not a rotating motor' };
        }

        // Scale by voltage ratio
        const voltageRatio = Math.min(supplyVoltage / ratedVoltage, 1.5);

        // Back-EMF reduces effective voltage and thus speed
        // Simplified: RPM ∝ (V - IR)
        const backEMFvoltage = current * armatureR;
        const effectiveVoltage = supplyVoltage - backEMFvoltage;

        // Approximate RPM
        const speedRatio = Math.max(0, effectiveVoltage / ratedVoltage);
        const rpm = noLoadRPM * speedRatio * voltageRatio;

        return {
            rpm: Math.round(rpm),
            speedPercent: (speedRatio * 100).toFixed(1),
            effectiveVoltage: effectiveVoltage.toFixed(2),
            backEMFvoltage: backEMFvoltage.toFixed(2),
            disclaimer: '⚠️ Approximate  estimate only. The actual RPM value may vary with load, motor design, and operating conditions.',
            note: 'Simple proportional model: RPM ∝ (V - IR)'
        };
    }

    /**
     * Get dial position for gauge (0-180 degrees)
     */
    getGaugeAngle(rpm) {
        const maxRPM = this.preset.noLoadRPM || 6000;
        const ratio = Math.min(rpm / maxRPM, 1);
        return -90 + (ratio * 180); // -90 = left, 90 = right
    }
}

/* ============================================
   Motor Simulator UI Class
   ============================================ */
class MotorSimulatorUI {
    constructor() {
        this.fieldCalc = new MagneticFieldCalculator();
        this.speedEstimator = new MotorSpeedEstimator();
        this.currentPreset = null;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.restoreSavedInputs(); // Restore inputs first
        this.loadFromURL();
        this.checkBatteryImport();
    }

    /**
     * Restore saved input values from localStorage
     */
    restoreSavedInputs() {
        if (typeof window.ChargedUP?.getPhysicsInputs !== 'function') return;

        const saved = window.ChargedUP.getPhysicsInputs();
        if (!saved) return;

        // Restore input values
        if (this.inputVoltage && saved.voltage !== undefined) this.inputVoltage.value = saved.voltage;
        if (this.inputCurrent && saved.current !== undefined) {
            this.inputCurrent.value = saved.current;
            if (this.displayCurrent) this.displayCurrent.textContent = `${saved.current} A`;
        }
        if (this.inputMotorR && saved.motorR !== undefined) this.inputMotorR.value = saved.motorR;
        if (this.inputCoilTurns && saved.coilTurns !== undefined) this.inputCoilTurns.value = saved.coilTurns;
        if (this.inputCoilLength && saved.coilLength !== undefined) this.inputCoilLength.value = saved.coilLength;
        if (this.inputMaterial && saved.material !== undefined) this.inputMaterial.value = saved.material;
        if (this.inputBatteryR && saved.batteryR !== undefined) this.inputBatteryR.value = saved.batteryR;

        // Trigger calculation with restored values
        this.calculate();
    }

    /**
     * Save current input values to localStorage
     */
    saveCurrentInputs() {
        if (typeof window.ChargedUP?.savePhysicsInputs !== 'function') return;

        const inputs = {
            voltage: parseFloat(this.inputVoltage?.value) || 6,
            current: parseFloat(this.inputCurrent?.value) || 1,
            motorR: parseFloat(this.inputMotorR?.value) || 3,
            coilTurns: parseFloat(this.inputCoilTurns?.value) || 50,
            coilLength: parseFloat(this.inputCoilLength?.value) || 2,
            material: this.inputMaterial?.value || 'air',
            batteryR: parseFloat(this.inputBatteryR?.value) || 0
        };

        window.ChargedUP.savePhysicsInputs(inputs);
    }

    bindElements() {
        // Preset buttons
        this.presetBtns = document.querySelectorAll('[data-motor-preset]');

        // Input elements
        this.inputVoltage = document.getElementById('input-supply-voltage');
        this.inputCurrent = document.getElementById('input-current');
        this.displayCurrent = document.getElementById('display-current');
        this.inputMotorR = document.getElementById('input-motor-r');
        this.inputCoilTurns = document.getElementById('input-coil-turns');
        this.inputCoilLength = document.getElementById('input-coil-length');
        this.inputMaterial = document.getElementById('input-material');
        this.inputBatteryR = document.getElementById('input-battery-r');

        // Import checkbox
        this.importBattery = document.getElementById('import-from-battery');

        // Result elements
        this.resultBField = document.getElementById('result-b-field');
        this.resultFormula = document.getElementById('result-formula');
        this.resultCurrent = document.getElementById('result-current');
        this.resultPower = document.getElementById('result-power');

        // Motor gauge elements
        this.gaugeValue = document.getElementById('gauge-value');
        this.gaugeDial = document.getElementById('gauge-dial');
        this.gaugeLabel = document.getElementById('gauge-label');

        // Work steps container
        this.workSteps = document.getElementById('physics-work-steps');

        // Canvas for field visualization
        this.fieldCanvas = document.getElementById('field-canvas');

        // Action buttons
        this.btnSaveForIntegrated = document.getElementById('btn-save-for-integrated');
    }

    bindEvents() {
        // Preset buttons
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const presetKey = btn.dataset.motorPreset;
                this.loadPreset(presetKey);
            });
        });

        // Current slider
        if (this.inputCurrent) {
            this.inputCurrent.addEventListener('input', () => {
                if (this.displayCurrent) {
                    this.displayCurrent.textContent = `${this.inputCurrent.value} A`;
                }
                this.calculate();
            });
        }

        // Other inputs
        const inputs = [
            this.inputVoltage, this.inputMotorR, this.inputCoilTurns,
            this.inputCoilLength, this.inputMaterial, this.inputBatteryR
        ];

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.calculate());
                input.addEventListener('change', () => this.calculate());
            }
        });

        // Import from battery checkbox
        if (this.importBattery) {
            this.importBattery.addEventListener('change', () => {
                if (this.importBattery.checked) {
                    this.importBatteryData();
                }
            });
        }

        // Action buttons
        if (this.btnSaveForIntegrated) {
            this.btnSaveForIntegrated.addEventListener('click', () => this.saveForIntegrated());
        }
    }

    loadPreset(presetKey) {
        const preset = MOTOR_PRESETS[presetKey];
        if (!preset) return;

        this.currentPreset = presetKey;
        this.speedEstimator = new MotorSpeedEstimator(preset);

        // Update inputs
        if (this.inputMotorR) this.inputMotorR.value = preset.armatureR;
        if (this.inputCoilTurns) this.inputCoilTurns.value = preset.coilTurns;
        if (this.inputCoilLength) this.inputCoilLength.value = preset.coilLength * 100; // cm
        if (this.inputVoltage) this.inputVoltage.value = preset.ratedVoltage;

        // Highlight active preset
        this.presetBtns.forEach(btn => {
            btn.classList.toggle('preset-btn--active', btn.dataset.motorPreset === presetKey);
        });

        this.calculate();
    }

    checkBatteryImport() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('fromBattery') === 'true') {
            const voltage = parseFloat(params.get('voltage'));
            const current = parseFloat(params.get('current'));

            if (voltage && this.inputVoltage) this.inputVoltage.value = voltage;
            if (current && this.inputCurrent) {
                this.inputCurrent.value = current;
                if (this.displayCurrent) this.displayCurrent.textContent = `${current} A`;
            }

            this.calculate();
        }
    }

    importBatteryData() {
        const storedData = localStorage.getItem('chargedup_battery_for_physics');
        if (!storedData) {
            alert('No battery data found. Please run the battery calculator first.');
            this.importBattery.checked = false;
            return;
        }

        try {
            const data = JSON.parse(storedData);

            if (data.packVoltage && this.inputVoltage) {
                this.inputVoltage.value = data.packVoltage;
            }
            if (data.packInternalR && this.inputBatteryR) {
                this.inputBatteryR.value = data.packInternalR;
            }
            if (data.motorCurrent && this.inputCurrent) {
                this.inputCurrent.value = data.motorCurrent;
                if (this.displayCurrent) {
                    this.displayCurrent.textContent = `${data.motorCurrent} A`;
                }
            }

            this.calculate();
        } catch (e) {
            console.error('Failed to parse battery data:', e);
        }
    }

    calculate() {
        const voltage = parseFloat(this.inputVoltage?.value) || 6;
        const current = parseFloat(this.inputCurrent?.value) || 1;
        const motorR = parseFloat(this.inputMotorR?.value) || 3;
        const coilTurns = parseInt(this.inputCoilTurns?.value) || 50;
        const coilLengthCm = parseFloat(this.inputCoilLength?.value) || 5;
        const coilLength = coilLengthCm / 100; // Convert to meters
        const material = this.inputMaterial?.value || 'air';
        const batteryR = parseFloat(this.inputBatteryR?.value) || 0;

        // Calculate B-field
        const bFieldResult = this.fieldCalc.computeBFieldSolenoid(
            coilTurns, current, coilLength, material
        );

        // Calculate loaded current if battery R is specified
        const currentResult = this.speedEstimator.computeLoadedCurrent(
            voltage, motorR, batteryR
        );

        // Estimate motor speed
        const speedResult = this.speedEstimator.estimateSpeed(current, voltage);

        // Store results
        this.lastResults = {
            bField: bFieldResult,
            current: currentResult,
            speed: speedResult,
            inputs: { voltage, current, motorR, coilTurns, coilLength, material }
        };

        this.displayResults(bFieldResult, currentResult, speedResult);
        this.updateFieldCanvas(bFieldResult, current);
        this.updateWorkSteps('solenoid', bFieldResult.inputs, bFieldResult);

        // Save current input values for persistence
        this.saveCurrentInputs();

        // Auto-save for integrated page
        this.autoSaveForIntegrated();
    }

    displayResults(bField, currentRes, speed) {
        // B-field result
        if (this.resultBField) {
            if (bField.B_mT > 0.001) {
                this.resultBField.textContent = `${bField.B_mT.toFixed(4)} mT`;
            } else {
                this.resultBField.textContent = `${bField.B_uT.toFixed(2)} μT`;
            }
        }

        if (this.resultFormula) {
            this.resultFormula.textContent = bField.formula;
        }

        if (this.resultCurrent) {
            this.resultCurrent.textContent = `${currentRes.current.toFixed(3)} A`;
        }

        if (this.resultPower) {
            this.resultPower.textContent = `${currentRes.powerMotor.toFixed(2)} W`;
        }

        // Update motor gauge
        if (speed.rpm !== null) {
            if (this.gaugeValue) {
                this.gaugeValue.textContent = `≈ ${speed.rpm} RPM`;
            }
            if (this.gaugeDial) {
                const angle = this.speedEstimator.getGaugeAngle(speed.rpm);
                this.gaugeDial.style.transform = `translateX(-50%) rotate(${angle}deg)`;
            }
            if (this.gaugeLabel) {
                this.gaugeLabel.textContent = speed.disclaimer;
            }
        }
    }

    updateFieldCanvas(bField, current) {
        if (!this.fieldCanvas) return;

        const ctx = this.fieldCanvas.getContext('2d');
        const w = this.fieldCanvas.width;
        const h = this.fieldCanvas.height;

        // Clear
        ctx.fillStyle = '#071733';
        ctx.fillRect(0, 0, w, h);

        // Draw solenoid coil
        const coilX = w * 0.3;
        const coilW = w * 0.4;
        const coilH = h * 0.4;
        const coilY = (h - coilH) / 2;

        ctx.strokeStyle = '#3EF1C6';
        ctx.lineWidth = 3;
        ctx.strokeRect(coilX, coilY, coilW, coilH);

        // Draw coil windings
        ctx.strokeStyle = 'rgba(0, 209, 255, 0.6)';
        ctx.lineWidth = 1;
        const turns = Math.min(20, bField.inputs.turns / 5);
        for (let i = 0; i < turns; i++) {
            const x = coilX + (i / turns) * coilW;
            ctx.beginPath();
            ctx.moveTo(x, coilY);
            ctx.lineTo(x, coilY + coilH);
            ctx.stroke();
        }

        // Draw field lines (density based on B-field strength)
        const intensity = Math.min(1, bField.B_mT / 10);
        const lineCount = Math.floor(3 + intensity * 10);

        ctx.strokeStyle = `rgba(0, 209, 255, ${0.3 + intensity * 0.5})`;
        ctx.lineWidth = 2;

        for (let i = 0; i < lineCount; i++) {
            const y = coilY + coilH * 0.2 + (i / lineCount) * coilH * 0.6;

            ctx.beginPath();
            // Field lines through center
            ctx.moveTo(coilX - 20, y);
            ctx.lineTo(coilX + coilW + 20, y);
            ctx.stroke();

            // Arrows showing direction
            if (current > 0) {
                ctx.beginPath();
                ctx.moveTo(coilX + coilW / 2, y);
                ctx.lineTo(coilX + coilW / 2 - 8, y - 4);
                ctx.lineTo(coilX + coilW / 2 - 8, y + 4);
                ctx.closePath();
                ctx.fillStyle = '#00D1FF';
                ctx.fill();
            }
        }

        // Label
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Magnetic field inside coil', coilX + coilW / 2 - 65, coilY - 10);
        ctx.fillText(`B ≈ ${bField.B_mT.toFixed(3)} mT`, coilX + coilW / 2 - 40, h - 20);
    }

    updateWorkSteps(type, inputs, result) {
        if (this.workSteps) {
            this.workSteps.innerHTML = this.fieldCalc.generateWorkSteps(type, inputs, result);
        }
    }

    loadFromURL() {
        const params = new URLSearchParams(window.location.search);

        if (params.has('preset')) {
            this.loadPreset(params.get('preset'));
        } else {
            if (params.has('voltage') && this.inputVoltage) {
                this.inputVoltage.value = params.get('voltage');
            }
            if (params.has('current') && this.inputCurrent) {
                this.inputCurrent.value = params.get('current');
                if (this.displayCurrent) {
                    this.displayCurrent.textContent = `${params.get('current')} A`;
                }
            }
            if (params.has('turns') && this.inputCoilTurns) {
                this.inputCoilTurns.value = params.get('turns');
            }

            this.calculate();
        }
    }

    autoSaveForIntegrated() {
        if (!this.lastResults) return;

        const dataForIntegrated = {
            bField: this.lastResults.bField?.B_mT,
            motorPower: this.lastResults.current?.powerMotor,
            estimatedRPM: this.lastResults.speed?.rpm,
            current: this.lastResults.inputs?.current,
            voltage: this.lastResults.inputs?.voltage,
            timestamp: Date.now()
        };

        localStorage.setItem('chargedup_motor_for_integrated', JSON.stringify(dataForIntegrated));
    }

    saveForIntegrated() {
        if (!this.lastResults) {
            this.calculate();
        }

        this.autoSaveForIntegrated();

        // Show notification
        if (window.ChargedUP?.showNotification) {
            window.ChargedUP.showNotification('Physics data saved for Integrated View!', 'success');
        } else {
            alert('Physics data saved! Go to Integrated View to see the complete energy chain.');
        }
    }
}

/* ============================================
   Right-Hand Rule Demonstrator
   ============================================ */
class RightHandRuleDemonstrator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.mode = 'wire'; // 'wire' or 'loop'

        this.resize();
        this.draw();

        window.addEventListener('resize', () => {
            this.resize();
            this.draw();
        });
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.min(rect.height || 250, 300);
    }

    setMode(mode) {
        this.mode = mode;
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = '#071733';
        ctx.fillRect(0, 0, w, h);

        if (this.mode === 'wire') {
            this.drawWireRule(ctx, w, h);
        } else {
            this.drawLoopRule(ctx, w, h);
        }
    }

    drawWireRule(ctx, w, h) {
        // Responsive sizing for mobile
        const isMobile = w < 350;
        const titleFont = isMobile ? 'bold 11px Inter, sans-serif' : 'bold 14px Inter, sans-serif';
        const textFont = isMobile ? '9px Inter, sans-serif' : '12px Inter, sans-serif';
        const smallFont = isMobile ? '8px Inter, sans-serif' : '11px Inter, sans-serif';

        const centerX = isMobile ? w * 0.5 : w * 0.4;
        const centerY = h / 2;

        // Legend at top-left (responsive sizing)
        ctx.fillStyle = '#3EF1C6';
        ctx.font = titleFont;
        ctx.fillText('RIGHT HAND RULE:', 8, isMobile ? 14 : 20);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = textFont;
        ctx.fillText('👍 Thumb → Current direction', 8, isMobile ? 26 : 38);
        ctx.fillText('✊ Fingers → Magnetic field', 8, isMobile ? 37 : 55);
        ctx.fillStyle = '#B6C0C9';
        ctx.font = smallFont;
        ctx.fillText('Electron flow is opposite to the current', 8, isMobile ? 47 : 72);

        // Draw wire (vertical) - start below legend on mobile
        const wireStart = isMobile ? 55 : 20;
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = isMobile ? 4 : 6;
        ctx.beginPath();
        ctx.moveTo(centerX, wireStart);
        ctx.lineTo(centerX, h - 15);
        ctx.stroke();

        // Current direction arrow (up)
        ctx.fillStyle = '#3EF1C6';
        ctx.beginPath();
        ctx.moveTo(centerX, wireStart + 5);
        ctx.lineTo(centerX - 8, wireStart + 20);
        ctx.lineTo(centerX + 8, wireStart + 20);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#F8FAFC';
        ctx.font = textFont;
        ctx.fillText('I', centerX + 12, wireStart + 15);

        // Draw magnetic field circles with directional arrows
        ctx.strokeStyle = '#00D1FF';
        ctx.lineWidth = 2;

        const radii = isMobile ? [25, 45, 65] : [35, 60, 85];
        radii.forEach(radius => {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw arrows showing counterclockwise direction
            const arrowAngles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
            arrowAngles.forEach(angle => {
                const ax = centerX + radius * Math.cos(angle);
                const ay = centerY + radius * Math.sin(angle);
                const tangentAngle = angle + Math.PI / 2;
                const arrowLen = 6;

                ctx.fillStyle = '#00D1FF';
                ctx.beginPath();
                ctx.moveTo(ax + arrowLen * Math.cos(tangentAngle), ay + arrowLen * Math.sin(tangentAngle));
                ctx.lineTo(ax + 4 * Math.cos(tangentAngle - 2.5), ay + 4 * Math.sin(tangentAngle - 2.5));
                ctx.lineTo(ax + 4 * Math.cos(tangentAngle + 2.5), ay + 4 * Math.sin(tangentAngle + 2.5));
                ctx.closePath();
                ctx.fill();
            });
        });

        // Label for magnetic field
        ctx.fillStyle = '#00D1FF';
        ctx.font = smallFont;
        ctx.fillText('Magnetic field', centerX + (isMobile ? 50 : 95), centerY - 10);

        // Draw stylized hand on the right side (hide on very small screens)
        if (w > 300) {
            this.drawRightHand(ctx, w - (isMobile ? 50 : 80), centerY, 'wire');
        }
    }

    drawLoopRule(ctx, w, h) {
        // Responsive sizing for mobile
        const isMobile = w < 350;
        const titleFont = isMobile ? 'bold 11px Inter, sans-serif' : 'bold 14px Inter, sans-serif';
        const textFont = isMobile ? '9px Inter, sans-serif' : '12px Inter, sans-serif';
        const smallFont = isMobile ? '8px Inter, sans-serif' : '11px Inter, sans-serif';

        const centerX = isMobile ? w * 0.5 : w * 0.4;
        const centerY = h / 2;
        const loopRadius = isMobile ? 40 : 55;

        // Legend at top-left (responsive sizing)
        ctx.fillStyle = '#3EF1C6';
        ctx.font = titleFont;
        ctx.fillText('RIGHT HAND RULE:', 8, isMobile ? 14 : 20);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = textFont;
        ctx.fillText('✊ Fingers → Current direction', 8, isMobile ? 26 : 38);
        ctx.fillText('👍 Thumb → Magnetic field', 8, isMobile ? 37 : 55);
        ctx.fillStyle = '#B6C0C9';
        ctx.font = smallFont;
        ctx.fillText('Electron flow is opposite to the current', 8, isMobile ? 47 : 72);

        // Draw loop
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = isMobile ? 3 : 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, loopRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Current direction arrows on loop (counterclockwise)
        ctx.fillStyle = '#3EF1C6';
        const arrowPositions = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        arrowPositions.forEach(angle => {
            const x = centerX + loopRadius * Math.cos(angle);
            const y = centerY + loopRadius * Math.sin(angle);
            const tangentAngle = angle + Math.PI / 2;
            const arrowLen = isMobile ? 7 : 10;

            ctx.beginPath();
            ctx.moveTo(x + arrowLen * Math.cos(tangentAngle), y + arrowLen * Math.sin(tangentAngle));
            ctx.lineTo(x + 5 * Math.cos(tangentAngle - 0.5), y + 5 * Math.sin(tangentAngle - 0.5));
            ctx.lineTo(x + 5 * Math.cos(tangentAngle + 0.5), y + 5 * Math.sin(tangentAngle + 0.5));
            ctx.closePath();
            ctx.fill();
        });

        ctx.fillStyle = '#3EF1C6';
        ctx.font = smallFont;
        ctx.fillText('I', centerX + loopRadius + 8, centerY);

        // Draw magnetic field through center
        ctx.strokeStyle = '#00D1FF';
        ctx.lineWidth = isMobile ? 2 : 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 20);
        ctx.lineTo(centerX, centerY - 35);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = '#00D1FF';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 35);
        ctx.lineTo(centerX - 6, centerY - 22);
        ctx.lineTo(centerX + 6, centerY - 22);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#00D1FF';
        ctx.font = smallFont;
        ctx.fillText('B', centerX + 10, centerY - 28);

        // Draw stylized hand (hide on very small screens)
        if (w > 300) {
            this.drawRightHand(ctx, w - (isMobile ? 50 : 80), centerY, 'loop');
        }
    }

    drawRightHand(ctx, x, y, mode) {
        // Draw a simplified right hand silhouette
        ctx.save();
        ctx.translate(x, y);

        // Hand palm (simplified oval)
        ctx.fillStyle = 'rgba(248, 250, 252, 0.15)';
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Thumb pointing up (for wire mode) or out (for loop mode)
        ctx.fillStyle = '#3EF1C6';
        ctx.strokeStyle = '#3EF1C6';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';

        ctx.beginPath();
        if (mode === 'wire') {
            // Thumb pointing up (current direction)
            ctx.moveTo(-20, -10);
            ctx.lineTo(-40, -40);
        } else {
            // Thumb pointing up/out (B direction)
            ctx.moveTo(-15, -25);
            ctx.lineTo(-35, -55);
        }
        ctx.stroke();

        // Arrow on thumb
        ctx.beginPath();
        if (mode === 'wire') {
            ctx.moveTo(-40, -40);
            ctx.lineTo(-35, -32);
            ctx.moveTo(-40, -40);
            ctx.lineTo(-45, -32);
        } else {
            ctx.moveTo(-35, -55);
            ctx.lineTo(-30, -47);
            ctx.moveTo(-35, -55);
            ctx.lineTo(-40, -47);
        }
        ctx.stroke();

        // Curled fingers
        ctx.strokeStyle = '#00D1FF';
        ctx.lineWidth = 4;

        // Draw curved fingers wrapping around
        ctx.beginPath();
        ctx.arc(0, 10, 30, -Math.PI * 0.3, Math.PI * 0.8);
        ctx.stroke();

        // Arrow on fingers showing curl direction
        ctx.fillStyle = '#00D1FF';
        ctx.beginPath();
        const arrowX = 30 * Math.cos(Math.PI * 0.7);
        const arrowY = 10 + 30 * Math.sin(Math.PI * 0.7);
        ctx.arc(arrowX, arrowY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Labels on hand
        ctx.fillStyle = '#3EF1C6';
        ctx.font = 'bold 10px Inter, sans-serif';
        if (mode === 'wire') {
            ctx.fillText('I', -55, -35);
        } else {
            ctx.fillText('B', -50, -50);
        }

        ctx.fillStyle = '#00D1FF';
        if (mode === 'wire') {
            ctx.fillText('B', 35, 25);
        } else {
            ctx.fillText('I', 35, 25);
        }

        ctx.restore();
    }
}

/* ============================================
   Initialize on DOM Ready
   ============================================ */
let motorSimulatorUI = null;
let rightHandRuleDemo = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize motor simulator if on physics page
    if (document.getElementById('motor-simulator')) {
        motorSimulatorUI = new MotorSimulatorUI();
    }

    // Initialize right-hand rule demo if canvas exists
    const rhrCanvas = document.getElementById('rhr-canvas');
    if (rhrCanvas) {
        rightHandRuleDemo = new RightHandRuleDemonstrator('rhr-canvas');
    }
});

// Export to global namespace
window.ChargedUP.MagneticFieldCalculator = MagneticFieldCalculator;
window.ChargedUP.MotorSpeedEstimator = MotorSpeedEstimator;
window.ChargedUP.MotorSimulatorUI = MotorSimulatorUI;
window.ChargedUP.RightHandRuleDemonstrator = RightHandRuleDemonstrator;
window.ChargedUP.MOTOR_PRESETS = MOTOR_PRESETS;
window.ChargedUP.PHYSICS_CONSTANTS = PHYSICS_CONSTANTS;
