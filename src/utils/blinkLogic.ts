// Eye landmarks indices for MediaPipe FaceMesh
export const LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];
export const RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];

/**
 * Calculate the Eye Aspect Ratio (EAR) for blink detection
 * EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * Where p1-p6 are the eye landmark points
 */
export function calculateEAR(eyeLandmarks: number[][]): number {
  if (eyeLandmarks.length !== 6) {
    throw new Error('Eye landmarks array must contain exactly 6 points');
  }

  // Extract coordinates
  const [p1, p2, p3, p4, p5, p6] = eyeLandmarks;

  // Calculate distances
  const vertical1 = Math.sqrt(
    Math.pow(p2[0] - p6[0], 2) + Math.pow(p2[1] - p6[1], 2)
  );
  
  const vertical2 = Math.sqrt(
    Math.pow(p3[0] - p5[0], 2) + Math.pow(p3[1] - p5[1], 2)
  );
  
  const horizontal = Math.sqrt(
    Math.pow(p1[0] - p4[0], 2) + Math.pow(p1[1] - p4[1], 2)
  );

  // Calculate EAR
  const ear = (vertical1 + vertical2) / (2 * horizontal);
  return ear;
}

/**
 * Extract eye landmarks from MediaPipe face results
 */
export function extractEyeLandmarks(
  landmarks: any[],
  eyeIndices: number[]
): number[][] {
  return eyeIndices.map(index => [
    landmarks[index].x,
    landmarks[index].y,
    landmarks[index].z || 0
  ]);
}

/**
 * Determine if a blink occurred based on EAR values
 */
export function detectBlink(
  leftEAR: number,
  rightEAR: number,
  threshold: number = 0.22
): boolean {
  const avgEAR = (leftEAR + rightEAR) / 2;
  return avgEAR < threshold;
}

/**
 * Blink detection state manager
 */
export class BlinkDetector {
  private consecutiveBlinkFrames: number = 0;
  private isBlinking: boolean = false;
  private readonly minBlinkFrames: number;
  private readonly earThreshold: number;

  constructor(minBlinkFrames: number = 2, earThreshold: number = 0.22) {
    this.minBlinkFrames = minBlinkFrames;
    this.earThreshold = earThreshold;
  }

  /**
   * Process a frame and return true if a complete blink is detected
   */
  processFrame(leftEAR: number, rightEAR: number): boolean {
    const isBelowThreshold = detectBlink(leftEAR, rightEAR, this.earThreshold);
    
    if (isBelowThreshold) {
      this.consecutiveBlinkFrames++;
      if (!this.isBlinking && this.consecutiveBlinkFrames >= this.minBlinkFrames) {
        this.isBlinking = true;
        return true; // Blink detected!
      }
    } else {
      // Eyes are open
      if (this.isBlinking) {
        this.isBlinking = false;
      }
      this.consecutiveBlinkFrames = 0;
    }
    
    return false;
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.consecutiveBlinkFrames = 0;
    this.isBlinking = false;
  }
}
