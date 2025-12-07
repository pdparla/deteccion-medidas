import { BodyMeasurements, CapturedImage, ProcessedCapture, ViewType } from './measurement';

export interface UserInfo {
  heightCm: number;
  gender?: 'male' | 'female';
}

export interface MeasurementSession {
  userInfo: UserInfo | null;
  captures: CapturedImage[];
  processedCaptures: ProcessedCapture[];
  measurements: BodyMeasurements | null;
  currentView: ViewType;
  isProcessing: boolean;
  error: string | null;
}

export interface MeasurementSessionActions {
  setUserInfo: (info: UserInfo) => void;
  addCapture: (capture: CapturedImage) => void;
  setProcessedCaptures: (captures: ProcessedCapture[]) => void;
  setMeasurements: (measurements: BodyMeasurements) => void;
  setCurrentView: (view: ViewType) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  nextView: () => void;
  previousView: () => void;
}

export const VIEW_ORDER: ViewType[] = ['front', 'right', 'back', 'left'];

export const VIEW_LABELS: Record<ViewType, string> = {
  front: 'Vista Frontal',
  right: 'Vista Lateral Derecha',
  back: 'Vista Posterior',
  left: 'Vista Lateral Izquierda',
};

export const VIEW_INSTRUCTIONS: Record<ViewType, string[]> = {
  front: [
    'Colócate mirando directamente a la cámara',
    'Mantén los brazos ligeramente separados del cuerpo',
    'Asegúrate de que todo tu cuerpo sea visible',
    'Mantén una postura recta y natural'
  ],
  right: [
    'Gira 90° a tu derecha',
    'Tu lado derecho debe mirar a la cámara',
    'Mantén los brazos a los lados',
    'Asegúrate de que tu perfil completo sea visible'
  ],
  back: [
    'Da la espalda a la cámara',
    'Mantén los brazos ligeramente separados',
    'Asegúrate de que toda tu espalda sea visible',
    'Mantén una postura recta'
  ],
  left: [
    'Gira 90° a tu izquierda',
    'Tu lado izquierdo debe mirar a la cámara',
    'Mantén los brazos a los lados',
    'Asegúrate de que tu perfil completo sea visible'
  ],
};
