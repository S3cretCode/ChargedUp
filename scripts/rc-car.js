/* ============================================
   ChargedUP: RC Car Simulations
   Side-view animation & Top-down race track
   ============================================ */

(function () {
    'use strict';

    /* ============================================
       RC Car Simulation Class
       ============================================ */
    class RCCarSimulator {
        constructor(containerId) {
            this.containerId = containerId;
            this.container = null;
            this.sideCanvas = null;
            this.trackCanvas = null;
            this.animationId = null;

            // Car physics state
            this.state = {
                position: 0,         // meters from start
                velocity: 0,         // m/s
                acceleration: 0,     // m/s²
                motorForce: 0,       // N (stored for display)
                friction: 0,         // N (stored for display)
                batteryCharge: 100,  // percent
                lapCount: 0,
                lapTime: 0,
                bestLapTime: Infinity,
                totalEnergy: 0,      // Joules used
                isRunning: false,
                // Display values with stability detection
                displayAccel: 0,
                displayVelocity: 0,
                displayFriction: 0,
                // Stability tracking - lock values when stable
                lastAccel: 0,
                accelStableCount: 0,
                stableAccel: 0,
                lastFriction: 0,
                frictionStableCount: 0,
                stableFriction: 0,
                lastVelocity: 0,
                velocityStableCount: 0,
                stableVelocity: 0
            };

            // Car parameters (defaults)
            this.params = {
                mass: 0.5,           // kg (500g car)
                wheelRadius: 0.02,   // m (2cm)
                motorEfficiency: 0.7,
                frictionCoeff: 0.3,
                airResistance: 0.05,
                maxTorque: 0.1,      // N·m
                batteryVoltage: 6.0,
                batteryCurrent: 1.0,
                batteryCapacity: 2000, // mAh
                internalR: 1.2,
                throttle: 0           // 0-1
            };

            // Track settings
            this.track = {
                length: 20,          // meters (full lap)
                width: 400,          // pixels
                height: 300,
                carX: 0,
                carAngle: 0
            };

            // Timing
            this.lastTime = 0;
            this.dt = 0.016; // 60fps

            // UI Update throttling - only update DOM at ~8 FPS to prevent flickering
            this.UI_UPDATE_INTERVAL = 120; // ms
            this.lastUIUpdate = 0;
        }

        // Helper: Round to 3 decimal places for stable display
        roundTo3dp(value) {
            return Math.round(value * 1000) / 1000;
        }

        // Helper: Only update DOM if value has changed (prevents flickering)
        setText(id, value) {
            const el = document.getElementById(id);
            if (el && el.textContent !== value) {
                el.textContent = value;
            }
        }

        /* ============================================
           Physics Calculations
           ============================================ */
        calculateMotorForce() {
            // F_motor = (τ / r) × throttle × efficiency
            const torque = this.params.maxTorque * this.params.throttle;
            const force = (torque / this.params.wheelRadius) * this.params.motorEfficiency;
            return force;
        }

        calculateFriction() {
            // f = μ × N = μ × m × g
            const normalForce = this.params.mass * 9.81;
            const friction = this.params.frictionCoeff * normalForce;

            // Friction opposes motion when car is moving
            if (this.state.velocity > 0.001) {
                return -friction;
            }
            return 0;
        }

        calculateAirResistance() {
            // F_air = -k × v²
            const airDrag = this.params.airResistance * this.state.velocity * Math.abs(this.state.velocity);
            return -airDrag;
        }

        calculateAcceleration() {
            const motorForce = this.calculateMotorForce();
            const friction = this.calculateFriction();
            const airDrag = this.calculateAirResistance();

            // F_net = F_motor + F_friction + F_air
            const netForce = motorForce + friction + airDrag;

            // a = F / m
            let acceleration = netForce / this.params.mass;

            // Only round truly tiny values (ten-thousandths) to zero
            // Values between -0.0005 and 0.0005 get rounded to 0
            if (Math.abs(acceleration) < 0.0005) {
                acceleration = 0;
            }

            return acceleration;
        }

        updateBattery(dt) {
            if (this.params.throttle > 0) {
                // Energy used = P × t = V × I × t
                const power = this.params.batteryVoltage * this.params.batteryCurrent * this.params.throttle;
                const energyUsed = power * dt;
                this.state.totalEnergy += energyUsed;

                // Drain battery based on capacity
                // Full capacity in Joules: V × (mAh × 3.6)
                const fullCapacity = this.params.batteryVoltage * (this.params.batteryCapacity * 3.6);
                this.state.batteryCharge = Math.max(0, 100 - (this.state.totalEnergy / fullCapacity * 100));
            }
        }

        updatePhysics(dt) {
            // Don't run if battery is dead
            if (this.state.batteryCharge <= 0) {
                this.params.throttle = 0;
            }

            // Store calculated forces for display
            this.state.motorForce = this.calculateMotorForce();
            this.state.friction = Math.abs(this.calculateFriction());

            // Calculate new acceleration
            this.state.acceleration = this.calculateAcceleration();

            // Update velocity: v = v₀ + at
            this.state.velocity += this.state.acceleration * dt;

            // Clamp velocity to 0 with threshold (prevents tiny oscillations)
            if (this.state.velocity < 0.001) {
                this.state.velocity = 0;
            }

            // Clamp acceleration near zero to prevent flickering
            if (Math.abs(this.state.acceleration) < 0.001) {
                this.state.acceleration = 0;
            }

            // Note: Display values are calculated in updateUI() with stabilization
            // to prevent flickering (not updated every physics frame)

            // Update position: x = x₀ + vt
            this.state.position += this.state.velocity * dt;

            // Check for lap completion
            if (this.state.position >= this.track.length) {
                this.state.position -= this.track.length;
                this.state.lapCount++;

                if (this.state.lapTime > 0 && this.state.lapTime < this.state.bestLapTime) {
                    this.state.bestLapTime = this.state.lapTime;
                }
                this.state.lapTime = 0;
            }

            this.state.lapTime += dt;

            // Update battery
            this.updateBattery(dt);
        }

        /* ============================================
           Side-View Rendering
           ============================================ */
        renderSideView() {
            const canvas = this.sideCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            // Clear canvas
            ctx.fillStyle = '#0a1628';
            ctx.fillRect(0, 0, w, h);

            // Draw ground with moving texture based on velocity
            const groundOffset = (this.state.position * 50) % 40;
            ctx.fillStyle = '#1a2a40';
            ctx.fillRect(0, h - 40, w, 40);

            // Ground texture lines
            ctx.strokeStyle = '#2a3a50';
            ctx.lineWidth = 2;
            for (let x = -groundOffset; x < w; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, h - 35);
                ctx.lineTo(x + 20, h - 35);
                ctx.stroke();
            }

            // Draw RC Car (centered)
            const carX = w / 2 - 40;
            const carY = h - 70;
            this.drawSideViewCar(ctx, carX, carY);

            // Draw force vectors
            this.drawForceVectors(ctx, carX + 40, carY + 15);

            // Draw speedometer
            this.drawSpeedometer(ctx, w - 100, 20);

            // Draw battery indicator
            this.drawBatteryIndicator(ctx, 20, 20);

            // Draw stats
            this.drawStats(ctx, 20, h - 50);
        }

        drawSideViewCar(ctx, x, y) {
            // Car body
            const gradient = ctx.createLinearGradient(x, y, x, y + 30);
            gradient.addColorStop(0, '#00D1FF');
            gradient.addColorStop(1, '#006688');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, 80, 25, 8);
            ctx.fill();

            // Roof
            ctx.fillStyle = '#00A0CC';
            ctx.beginPath();
            ctx.moveTo(x + 15, y);
            ctx.lineTo(x + 30, y - 12);
            ctx.lineTo(x + 60, y - 12);
            ctx.lineTo(x + 70, y);
            ctx.fill();

            // Windows
            ctx.fillStyle = '#0a1628';
            ctx.beginPath();
            ctx.moveTo(x + 20, y);
            ctx.lineTo(x + 32, y - 9);
            ctx.lineTo(x + 55, y - 9);
            ctx.lineTo(x + 65, y);
            ctx.fill();

            // Wheels with rotation
            const wheelRotation = (this.state.position * 10) % (2 * Math.PI);

            // Front wheel
            this.drawWheel(ctx, x + 15, y + 25, 12, wheelRotation);

            // Rear wheel
            this.drawWheel(ctx, x + 65, y + 25, 12, wheelRotation);

            // Speed lines when moving fast
            if (this.state.velocity > 1) {
                const alpha = Math.min(this.state.velocity / 5, 0.6);
                ctx.strokeStyle = `rgba(0, 209, 255, ${alpha})`;
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const lineY = y + 5 + i * 6;
                    const lineLength = 20 + this.state.velocity * 5;
                    ctx.beginPath();
                    ctx.moveTo(x - 10, lineY);
                    ctx.lineTo(x - 10 - lineLength, lineY);
                    ctx.stroke();
                }
            }
        }

        drawWheel(ctx, x, y, radius, rotation) {
            // Tire
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Rim
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Spokes
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = rotation + (i * Math.PI * 2 / 5);
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + Math.cos(angle) * radius * 0.5,
                    y + Math.sin(angle) * radius * 0.5
                );
                ctx.stroke();
            }

            // Hub
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        drawForceVectors(ctx, x, y) {
            // Use stored values from state to prevent recalculation flickering
            const motorForce = this.state.motorForce;
            const friction = this.state.displayFriction; // Use smoothed display value
            const acceleration = this.state.displayAccel; // Use smoothed display value
            const scale = 5;

            // Draw force info panel in upper left (avoiding car)
            ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
            ctx.beginPath();
            ctx.roundRect(130, 15, 160, 55, 8);
            ctx.fill();

            // Motor force label
            ctx.fillStyle = '#3EF1C6';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(`F = ${motorForce.toFixed(2)} N`, 140, 32);

            // Friction label  
            ctx.fillStyle = '#ff6347';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(`f = ${friction.toFixed(2)} N`, 140, 48);

            // Acceleration label
            ctx.fillStyle = '#00D1FF';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(`a = ${acceleration.toFixed(2)} m/s²`, 140, 64);

            // Draw small force arrows next to car (but no text labels there)
            // Motor force (right, green)
            if (motorForce > 0.1) {
                ctx.strokeStyle = '#3EF1C6';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x + 45, y);
                ctx.lineTo(x + 45 + Math.min(motorForce * scale, 40), y);
                ctx.stroke();

                // Arrow head
                ctx.fillStyle = '#3EF1C6';
                ctx.beginPath();
                const arrowX = x + 45 + Math.min(motorForce * scale, 40);
                ctx.moveTo(arrowX + 6, y);
                ctx.lineTo(arrowX, y - 4);
                ctx.lineTo(arrowX, y + 4);
                ctx.fill();
            }

            // Friction force (left, red)
            if (friction > 0.1 && this.state.velocity > 0.1) {
                ctx.strokeStyle = '#ff6347';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - 5, y + 8);
                ctx.lineTo(x - 5 - Math.min(friction * scale, 30), y + 8);
                ctx.stroke();
            }
        }

        drawSpeedometer(ctx, x, y) {
            const maxSpeed = 5; // m/s
            // Use smoothed display value to prevent flickering
            const speed = this.state.displayVelocity;
            const speedKmh = speed * 3.6;

            // Background
            ctx.fillStyle = 'rgba(10, 22, 40, 0.8)';
            ctx.beginPath();
            ctx.roundRect(x, y, 80, 60, 8);
            ctx.fill();

            // Label
            ctx.fillStyle = '#888';
            ctx.font = '10px Inter';
            ctx.fillText('SPEED', x + 24, y + 15);

            // Speed value
            ctx.fillStyle = '#00D1FF';
            ctx.font = 'bold 20px Inter';
            ctx.fillText(speedKmh.toFixed(1), x + 10, y + 40);

            ctx.fillStyle = '#888';
            ctx.font = '10px Inter';
            ctx.fillText('km/h', x + 50, y + 40);

            // Speed bar
            const barWidth = (speed / maxSpeed) * 70;
            ctx.fillStyle = speed > maxSpeed * 0.8 ? '#3EF1C6' : '#00D1FF';
            ctx.fillRect(x + 5, y + 48, barWidth, 4);
        }

        drawBatteryIndicator(ctx, x, y) {
            // Background
            ctx.fillStyle = 'rgba(10, 22, 40, 0.8)';
            ctx.beginPath();
            ctx.roundRect(x, y, 100, 40, 8);
            ctx.fill();

            // Battery icon
            ctx.strokeStyle = this.state.batteryCharge > 20 ? '#3EF1C6' : '#ff6347';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 10, y + 12, 30, 16);
            ctx.fillStyle = this.state.batteryCharge > 20 ? '#3EF1C6' : '#ff6347';
            ctx.fillRect(x + 40, y + 17, 3, 6);

            // Fill level
            const fillWidth = (this.state.batteryCharge / 100) * 26;
            ctx.fillRect(x + 12, y + 14, fillWidth, 12);

            // Percentage
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Inter';
            ctx.fillText(`${Math.round(this.state.batteryCharge)}%`, x + 50, y + 27);
        }

        drawStats(ctx, x, y) {
            // Stats are now displayed in the HTML results panel below the canvas
            // This function is kept for potential future use but draws nothing
        }

        /* ============================================
           Top-Down Track Rendering
           ============================================ */
        renderTrackView() {
            const canvas = this.trackCanvas;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            // Clear canvas
            ctx.fillStyle = '#0a1628';
            ctx.fillRect(0, 0, w, h);

            // Draw oval track
            this.drawTrack(ctx, w, h);

            // Draw car on track
            this.drawTrackCar(ctx, w, h);

            // Draw lap info
            this.drawLapInfo(ctx, w, h);
        }

        drawTrack(ctx, w, h) {
            const centerX = w / 2;
            const centerY = h / 2;
            const outerRadiusX = w * 0.4;
            const outerRadiusY = h * 0.35;
            const innerRadiusX = w * 0.25;
            const innerRadiusY = h * 0.2;

            // Outer track boundary
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Track surface
            ctx.fillStyle = '#1a2a40';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner boundary
            ctx.fillStyle = '#0a1628';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Track center line (dashed)
            const midRadiusX = (outerRadiusX + innerRadiusX) / 2;
            const midRadiusY = (outerRadiusY + innerRadiusY) / 2;
            ctx.strokeStyle = '#3a4a60';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, midRadiusX, midRadiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Start/Finish line (at top of track where car starts)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - innerRadiusY - 5);
            ctx.lineTo(centerX, centerY - outerRadiusY + 5);
            ctx.stroke();
        }

        drawTrackCar(ctx, w, h) {
            const centerX = w / 2;
            const centerY = h / 2;
            const trackRadiusX = w * 0.325;
            const trackRadiusY = h * 0.275;

            // Calculate car position on track based on distance
            const progress = (this.state.position / this.track.length) * Math.PI * 2;
            const carX = centerX + Math.cos(progress - Math.PI / 2) * trackRadiusX;
            const carY = centerY + Math.sin(progress - Math.PI / 2) * trackRadiusY;

            // Car direction (tangent to track)
            const angle = progress;

            ctx.save();
            ctx.translate(carX, carY);
            ctx.rotate(angle);

            // Car body (top view)
            const gradient = ctx.createLinearGradient(-12, 0, 12, 0);
            gradient.addColorStop(0, '#00A0CC');
            gradient.addColorStop(0.5, '#00D1FF');
            gradient.addColorStop(1, '#00A0CC');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(-8, -12, 16, 24, 3);
            ctx.fill();

            // Windshield
            ctx.fillStyle = '#0a1628';
            ctx.fillRect(-5, -8, 10, 6);

            // Wheels
            ctx.fillStyle = '#222';
            ctx.fillRect(-10, -10, 4, 8);
            ctx.fillRect(6, -10, 4, 8);
            ctx.fillRect(-10, 2, 4, 8);
            ctx.fillRect(6, 2, 4, 8);

            ctx.restore();

            // Speed trail
            if (this.state.velocity > 0.5) {
                const trailLength = Math.min(this.state.velocity * 10, 30);
                const prevProgress = ((this.state.position - this.state.velocity * 0.1) / this.track.length) * Math.PI * 2;
                const prevX = centerX + Math.cos(prevProgress - Math.PI / 2) * trackRadiusX;
                const prevY = centerY + Math.sin(prevProgress - Math.PI / 2) * trackRadiusY;

                const trailGradient = ctx.createLinearGradient(prevX, prevY, carX, carY);
                trailGradient.addColorStop(0, 'rgba(0, 209, 255, 0)');
                trailGradient.addColorStop(1, 'rgba(0, 209, 255, 0.5)');

                ctx.strokeStyle = trailGradient;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(carX, carY);
                ctx.stroke();
            }
        }

        drawLapInfo(ctx, w, h) {
            // Lap counter
            ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
            ctx.beginPath();
            ctx.roundRect(10, 10, 120, 70, 8);
            ctx.fill();

            ctx.fillStyle = '#888';
            ctx.font = '10px Inter';
            ctx.fillText('LAP', 20, 28);

            ctx.fillStyle = '#00D1FF';
            ctx.font = 'bold 24px Inter';
            ctx.fillText(this.state.lapCount.toString(), 20, 55);

            ctx.fillStyle = '#888';
            ctx.font = '10px Inter';
            ctx.fillText(`Time: ${this.state.lapTime.toFixed(1)}s`, 20, 72);

            // Best lap
            if (this.state.bestLapTime < Infinity) {
                ctx.fillStyle = '#3EF1C6';
                ctx.fillText(`Best: ${this.state.bestLapTime.toFixed(1)}s`, 70, 28);
            }

            // Energy per lap
            const energyPerLap = this.state.lapCount > 0
                ? (this.state.totalEnergy / this.state.lapCount / 1000).toFixed(2)
                : '--';

            ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
            ctx.beginPath();
            ctx.roundRect(w - 130, 10, 120, 40, 8);
            ctx.fill();

            ctx.fillStyle = '#888';
            ctx.font = '10px Inter';
            ctx.fillText('Energy/Lap', w - 120, 28);

            ctx.fillStyle = '#3EF1C6';
            ctx.font = 'bold 14px Inter';
            ctx.fillText(`${energyPerLap} kJ`, w - 120, 45);
        }

        /* ============================================
           Animation Loop
           ============================================ */
        animate(timestamp) {
            if (!this.lastTime) this.lastTime = timestamp;
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
            this.lastTime = timestamp;

            if (this.state.isRunning) {
                this.updatePhysics(dt);
            }

            this.renderSideView();
            this.renderTrackView();

            // Throttle UI updates to ~8 FPS to prevent DOM flickering
            if (timestamp - this.lastUIUpdate > this.UI_UPDATE_INTERVAL) {
                this.updateUI();
                this.lastUIUpdate = timestamp;
            }

            this.animationId = requestAnimationFrame((t) => this.animate(t));
        }

        // Centralized UI update function - called at throttled interval
        // Uses stabilization to prevent flickering from floating-point jitter
        updateUI() {
            // Update slider displays
            this.setText('rc-throttle-display', `${Math.round(this.params.throttle * 100)}%`);
            this.setText('rc-mass-display', `${(this.params.mass * 1000).toFixed(0)} g`);
            this.setText('rc-friction-display', this.params.frictionCoeff.toFixed(2));

            // Stabilize values: only update display if change exceeds threshold
            // This prevents oscillation between two values near boundaries
            const STABILITY_THRESHOLD = 0.002;

            // Stabilize acceleration
            let accel = this.state.acceleration;
            if (Math.abs(accel) < 0.001) accel = 0;
            if (Math.abs(accel - this.state.displayAccel) > STABILITY_THRESHOLD || accel === 0) {
                this.state.displayAccel = this.roundTo3dp(accel);
            }

            // Stabilize velocity
            let vel = this.state.velocity;
            if (Math.abs(vel) < 0.001) vel = 0;
            if (Math.abs(vel - this.state.displayVelocity) > STABILITY_THRESHOLD || vel === 0) {
                this.state.displayVelocity = this.roundTo3dp(vel);
            }

            // Stabilize friction (follows velocity pattern)
            let fric = this.state.friction;
            if (this.state.velocity === 0) fric = 0;
            if (Math.abs(fric - this.state.displayFriction) > STABILITY_THRESHOLD || fric === 0) {
                this.state.displayFriction = this.roundTo3dp(fric);
            }

            // Update kinematics results
            const power = this.roundTo3dp(this.params.batteryVoltage * this.params.batteryCurrent * this.params.throttle);

            this.setText('rc-result-force', `${this.state.motorForce.toFixed(3)} N`);
            this.setText('rc-result-accel', `${this.state.displayAccel.toFixed(3)} m/s²`);
            this.setText('rc-result-velocity', `${this.state.displayVelocity.toFixed(2)} m/s (${(this.state.displayVelocity * 3.6).toFixed(1)} km/h)`);
            this.setText('rc-result-power', `${power.toFixed(2)} W`);
        }

        /* ============================================
           Initialization
           ============================================ */
        init() {
            this.container = document.getElementById(this.containerId);
            if (!this.container) return;

            this.sideCanvas = document.getElementById('rc-side-canvas');
            this.trackCanvas = document.getElementById('rc-track-canvas');

            if (this.sideCanvas) {
                this.sideCanvas.width = this.sideCanvas.offsetWidth || 500;
                this.sideCanvas.height = 180;
            }

            if (this.trackCanvas) {
                this.trackCanvas.width = this.trackCanvas.offsetWidth || 400;
                this.trackCanvas.height = 300;
            }

            this.setupEventListeners();
            this.loadBatteryData();
            this.animate(0);
        }

        setupEventListeners() {
            // Throttle slider
            const throttleSlider = document.getElementById('rc-throttle');
            if (throttleSlider) {
                throttleSlider.addEventListener('input', (e) => {
                    this.params.throttle = parseFloat(e.target.value) / 100;
                    if (this.params.throttle > 0 && !this.state.isRunning) {
                        this.state.isRunning = true;
                        // Update button text to show Pause
                        const startBtn = document.getElementById('rc-start');
                        if (startBtn) startBtn.textContent = '⏸ Pause';
                    }
                });
            }

            // Mass slider
            const massSlider = document.getElementById('rc-mass');
            if (massSlider) {
                massSlider.addEventListener('input', (e) => {
                    this.params.mass = parseFloat(e.target.value) / 1000;
                });
            }

            // Friction slider
            const frictionSlider = document.getElementById('rc-friction');
            if (frictionSlider) {
                frictionSlider.addEventListener('input', (e) => {
                    this.params.frictionCoeff = parseFloat(e.target.value);
                });
            }

            // Reset button
            const resetBtn = document.getElementById('rc-reset');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.reset());
            }

            // Start/Stop button
            const startBtn = document.getElementById('rc-start');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    this.state.isRunning = !this.state.isRunning;
                    startBtn.textContent = this.state.isRunning ? '⏸ Pause' : '▶ Start';
                });
            }
        }

        loadBatteryData() {
            const batteryData = localStorage.getItem('chargedup-chemistry-data');
            if (batteryData) {
                try {
                    const data = JSON.parse(batteryData);
                    if (data.packVoltage) this.params.batteryVoltage = data.packVoltage;
                    if (data.capacityMah) this.params.batteryCapacity = data.capacityMah;
                    if (data.internalR) this.params.internalR = data.internalR;
                    if (data.motorCurrent) this.params.batteryCurrent = data.motorCurrent;
                } catch (e) {
                    console.log('No battery data to load');
                }
            }
        }

        reset() {
            this.state = {
                position: 0,
                velocity: 0,
                acceleration: 0,
                motorForce: 0,
                friction: 0,
                batteryCharge: 100,
                lapCount: 0,
                lapTime: 0,
                bestLapTime: Infinity,
                totalEnergy: 0,
                isRunning: false,
                displayAccel: 0,
                displayVelocity: 0,
                displayFriction: 0,
                lastAccel: 0,
                accelStableCount: 0,
                stableAccel: 0,
                lastFriction: 0,
                frictionStableCount: 0,
                stableFriction: 0,
                lastVelocity: 0,
                velocityStableCount: 0,
                stableVelocity: 0
            };
            this.params.throttle = 0;

            const throttleSlider = document.getElementById('rc-throttle');
            if (throttleSlider) throttleSlider.value = 0;

            const startBtn = document.getElementById('rc-start');
            if (startBtn) startBtn.textContent = '▶ Start';
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }

    /* ============================================
       Initialize on DOM Ready
       ============================================ */
    function initRCCarSimulator() {
        const container = document.getElementById('rc-car-simulator');
        if (container) {
            window.rcCarSim = new RCCarSimulator('rc-car-simulator');
            window.rcCarSim.init();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRCCarSimulator);
    } else {
        initRCCarSimulator();
    }

    // Export for external use
    window.RCCarSimulator = RCCarSimulator;

})();
