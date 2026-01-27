# Test Results - ChargedUP

Verification testing performed on December 20th.

## Calculator Verification

### Chemistry Calculator Tests

#### Test 1: Single AA Alkaline (Commercial Mode)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Cell Voltage | 1.5 V | 1.5 V | ✓ |
| Capacity | 2000 mAh | 2000 mAh | ✓ |
| Charge (Q) | 7200 C | 7200 C | ✓ |
| Energy (J) | 10,800 J | 10,800 J | ✓ |
| Energy (Wh) | 3.0 Wh | 3.0 Wh | ✓ |

#### Test 2: 4×AA Alkaline Pack (Series)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Pack Voltage | 6.0 V | 6.0 V | ✓ |
| Pack Capacity | 2000 mAh | 2000 mAh | ✓ |
| Total Energy | 43,200 J | 43,200 J | ✓ |
| Energy (Wh) | 12.0 Wh | 12.0 Wh | ✓ |
| Internal R | 1.2 Ω | 1.2 Ω | ✓ |

#### Test 3: Voltage Sag (1A draw, 1.2Ω internal)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Open-Circuit V | 6.0 V | 6.0 V | ✓ |
| Voltage Drop | 1.2 V | 1.2 V | ✓ |
| Loaded Voltage | 4.8 V | 4.8 V | ✓ |
| Power Loss | 1.44 W | 1.44 W | ✓ |

#### Test 4: Stoichiometry (1g Zn, 2g MnO₂)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Moles Zn | 0.01530 mol | 0.01530 mol | ✓ |
| Moles MnO₂ | 0.02301 mol | 0.02301 mol | ✓ |
| Limiting Reagent | MnO₂ | MnO₂ | ✓ |
| Moles e⁻ | 0.02301 mol | 0.02301 mol | ✓ |
| Charge | 2220 C | 2220 C | ✓ |

### Physics Calculator Tests

#### Test 5: Solenoid B-Field (Air Core)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Turns (N) | 50 | 50 | ✓ |
| Current (I) | 1 A | 1 A | ✓ |
| Length (L) | 0.02 m | 0.02 m | ✓ |
| B-Field | 3.14 mT | 3.14 mT | ✓ |

#### Test 6: Solenoid with Iron Core

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| μᵣ | 4000 | 4000 | ✓ |
| B-Field | ~12.57 T | 12.57 T | ✓ |

#### Test 7: Motor Current (6V, 3Ω motor, 1.2Ω battery)

| Property | Expected | Calculated | ✓/✗ |
|----------|----------|------------|-----|
| Total Resistance | 4.2 Ω | 4.2 Ω | ✓ |
| Current | 1.43 A | 1.43 A | ✓ |
| Motor Power | 6.13 W | 6.13 W | ✓ |

## UI/UX Tests

### Theme Switching

| Action | Expected | Result | ✓/✗ |
|--------|----------|--------|-----|
| Click dark button | Theme = dark | Applied | ✓ |
| Click light button | Theme = light | Applied | ✓ |
| Reload page | Theme persists | Persisted | ✓ |

### Text Size

| Action | Expected | Result | ✓/✗ |
|--------|----------|--------|-----|
| Click small | Text smaller | Applied | ✓ |
| Click large | Text larger | Applied | ✓ |
| Click default | Normal size | Applied | ✓ |

### Responsiveness

| Viewport | Layout | ✓/✗ |
|----------|--------|-----|
| Desktop (1440px) | Full layout | ✓ |
| Tablet (768px) | Collapsed nav | ✓ |
| Mobile (375px) | Mobile nav | ✓ |

## Integration Tests

### Chemistry → Physics Transfer

| Step | Expected | Result | ✓/✗ |
|------|----------|--------|-----|
| Calculate battery values | Values computed | ✓ |
| Click "Use in Motor Simulator" | Navigate + prefill | ✓ |
| Physics receives voltage | Correct value | ✓ |
| Physics receives current | Correct value | ✓ |

### Deep Linking

| Test | URL | Result | ✓/✗ |
|------|-----|--------|-----|
| Battery preset | `chemistry.html?preset=4aa-alkaline` | Loads preset | ✓ |
| Motor preset | `physics.html?preset=small-dc-motor` | Loads preset | ✓ |
| From battery flag | `physics.html?fromBattery=true` | Imports data | ✓ |

## Accessibility Tests

| Feature | Test | ✓/✗ |
|---------|------|-----|
| Skip link | Tab navigates to main | ✓ |
| ARIA labels | Buttons labeled | ✓ |
| Keyboard nav | All interactive elements | ✓ |
| Color contrast | WCAG AA | ✓ |
| Focus indicators | Visible | ✓ |

## Browser Compatibility

| Browser | Version | Status | ✓/✗ |
|---------|---------|--------|-----|
| Chrome | 120+ | Full support | ✓ |
| Firefox | 121+ | Full support | ✓ |
| Safari | 17+ | Full support | ✓ |
| Edge | 120+ | Full support | ✓ |

## Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Chemistry Calculator | 4 | 4 | 0 |
| Physics Calculator | 3 | 3 | 0 |
| UI/UX | 3 | 3 | 0 |
| Integration | 2 | 2 | 0 |
| Accessibility | 5 | 5 | 0 |
| Browser | 4 | 4 | 0 |
| **Total** | **21** | **21** | **0** |

---

*Testing completed December 20th*
