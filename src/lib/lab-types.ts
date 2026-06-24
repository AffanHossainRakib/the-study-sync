export interface LabSlot {
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  sectionName: string;
  faculties: string;
}

export interface LabRoomData {
  roomName: string;
  tags: string[];
  schedules: LabSlot[];
}

export interface LabMetadata {
  currentSemester: string;
  lastUpdated: string;
  fetchedAt: string;
}

export interface LabsAPIResponse {
  metadata: LabMetadata;
  labs: LabRoomData[];
}

export interface LabAvailabilityResult {
  availableLabs: LabRoomData[];
  isLabsClosed: boolean;
  message?: string;
}

