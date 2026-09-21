import { DowntimeState, AuditEvent, StaffRole } from "./types";
import { recordAuditEvent } from "./audit";

let downtimeState: DowntimeState = {
  isOutageActive: false,
  medIdCoreStatus: "ONLINE",
  ehrAdapterStatus: "ONLINE",
  ninProviderStatus: "ONLINE",
  auditSinkStatus: "ONLINE",
  queuedEventsCount: 0,
};

interface QueuedOfflineEvent {
  localId: string;
  offlineTimestamp: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  hospitalId: string;
  patientMedID: string;
  action: string;
  reason: string;
}

const offlineEventQueue: QueuedOfflineEvent[] = [];

export function getDowntimeState(): DowntimeState {
  return {
    ...downtimeState,
    queuedEventsCount: offlineEventQueue.length,
  };
}

export function setDowntimeOutage(active: boolean): DowntimeState {
  downtimeState.isOutageActive = active;

  if (active) {
    downtimeState.medIdCoreStatus = "DEGRADED";
    downtimeState.ehrAdapterStatus = "OFFLINE";
    downtimeState.ninProviderStatus = "OFFLINE";
    downtimeState.auditSinkStatus = "DEGRADED"; // Local queueing active
  } else {
    downtimeState.medIdCoreStatus = "ONLINE";
    downtimeState.ehrAdapterStatus = "ONLINE";
    downtimeState.ninProviderStatus = "ONLINE";
    downtimeState.auditSinkStatus = "ONLINE";
  }

  return getDowntimeState();
}

/**
 * Queues an event when remote audit destination or connectivity is degraded
 */
export function queueOfflineEvent(event: Omit<QueuedOfflineEvent, "localId" | "offlineTimestamp">): QueuedOfflineEvent {
  const localEvent: QueuedOfflineEvent = {
    ...event,
    localId: `OFFLINE-EVT-${String(offlineEventQueue.length + 1).padStart(4, "0")}`,
    offlineTimestamp: new Date().toISOString(),
  };

  offlineEventQueue.push(localEvent);
  downtimeState.queuedEventsCount = offlineEventQueue.length;
  return localEvent;
}

export function getQueuedEvents(): QueuedOfflineEvent[] {
  return [...offlineEventQueue];
}

/**
 * Reconciles buffered offline events to the cryptographic hash chain
 */
export function reconcileOfflineEvents(): { reconciledCount: number; events: AuditEvent[] } {
  const reconciled: AuditEvent[] = [];

  while (offlineEventQueue.length > 0) {
    const item = offlineEventQueue.shift();
    if (!item) break;

    const auditEvt = recordAuditEvent({
      eventType: "DOWNTIME_RECONCILED_ACCESS",
      actorId: item.actorId,
      actorName: item.actorName,
      actorRole: item.actorRole,
      hospitalId: item.hospitalId,
      patientMedID: item.patientMedID,
      action: item.action,
      resource: "EMERGENCY_RECORDS",
      decision: "ALLOW",
      purpose: `[DOWNTIME RECONCILIATION] ${item.reason}`,
      isOfflineReconciled: true,
      offlineTimestamp: item.offlineTimestamp,
    });

    reconciled.push(auditEvt);
  }

  downtimeState.queuedEventsCount = 0;
  return {
    reconciledCount: reconciled.length,
    events: reconciled,
  };
}
