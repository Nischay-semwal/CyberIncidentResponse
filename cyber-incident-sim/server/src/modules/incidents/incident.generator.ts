import { Difficulty, Severity, SystemStatus } from "@prisma/client";

type ScenarioInput = {
  difficulty: Difficulty;
  severity: Severity;
  affectedSystems: string[];
  eventTemplate: unknown;
  evidenceTemplate: unknown;
};

type GeneratedSystem = {
  name: string;
  type: string;
  status: SystemStatus;
  metadata: {
    simulated: true;
  };
};

type GeneratedEvent = {
  eventType: string;
  severity: Severity;
  sourceSystem: string;
  user?: string;
  sourceIP?: string;
  destinationIP?: string;
  description: string;
  metadata: {
    simulated: true;
    eventCategory: "RELEVANT" | "NOISE";
  };
  timestamp: Date;
};

type GeneratedEvidence = {
  type: string;
  severity: Severity;
  description: string;
  source: string;
  timestamp: Date;
};

export type GeneratedIncidentData = {
  systems: GeneratedSystem[];
  events: GeneratedEvent[];
  evidence: GeneratedEvidence[];
};

function generateSimulatedIP(index: number): string {
  return `192.0.2.${(index % 254) + 1}`;
}

function getSystemType(name: string): string {
  const normalized = name.toLowerCase();

  if (normalized.includes("workstation")) {
    return "ENDPOINT";
  }

  if (normalized.includes("mail")) {
    return "MAIL_SERVER";
  }

  if (
    normalized.includes("authentication") ||
    normalized.includes("auth")
  ) {
    return "AUTHENTICATION_SERVER";
  }

  if (normalized.includes("vpn")) {
    return "VPN_SERVER";
  }

  if (normalized.includes("firewall")) {
    return "FIREWALL";
  }

  return "SERVER";
}

function findMatchingSystem(
  systems: GeneratedSystem[],
  systemName: string
): string {
  const exactMatch = systems.find(
    (system) => system.name === systemName
  );

  if (exactMatch) {
    return exactMatch.name;
  }

  const partialMatch = systems.find(
    (system) =>
      system.name.toLowerCase().includes(systemName.toLowerCase()) ||
      systemName.toLowerCase().includes(system.name.toLowerCase())
  );

  return partialMatch?.name ?? systems[0]?.name ?? "Unknown System";
}

function generateSystems(
  affectedSystems: string[]
): GeneratedSystem[] {
  return affectedSystems.map((systemName) => ({
    name: systemName,
    type: getSystemType(systemName),
    status: SystemStatus.NORMAL,
    metadata: {
      simulated: true,
    },
  }));
}

function generateEvents(
  scenario: ScenarioInput,
  systems: GeneratedSystem[]
): GeneratedEvent[] {
  const template =
    scenario.eventTemplate as {
      totalEvents?: number;
      noiseEvents?: number;
      timeline?: string;
    };

  const totalEvents = template.totalEvents ?? 20;
  const noiseEvents = Math.min(
    template.noiseEvents ?? Math.floor(totalEvents * 0.3),
    totalEvents - 1
  );

  const relevantCount = totalEvents - noiseEvents;

  const relevantTemplates = [
    {
      eventType: "PHISHING_EMAIL_DELIVERED",
      description:
        "Simulated phishing email delivered to an employee mailbox.",
      sourceSystem: "Mail Server",
    },
    {
      eventType: "SUSPICIOUS_LINK_CLICKED",
      description:
        "Employee accessed a simulated suspicious URL contained in an email.",
      sourceSystem: "Employee Workstation",
    },
    {
      eventType: "CREDENTIAL_SUBMISSION",
      description:
        "Simulated credentials were submitted to a fraudulent authentication page.",
      sourceSystem: "Employee Workstation",
    },
    {
      eventType: "UNUSUAL_AUTHENTICATION",
      description:
        "Authentication activity was detected from an unusual simulated IP address.",
      sourceSystem: "Authentication Server",
    },
    {
      eventType: "MAILBOX_ACCESS",
      description:
        "Mailbox access occurred shortly after the suspicious authentication activity.",
      sourceSystem: "Mail Server",
    },
    {
      eventType: "SUSPICIOUS_OUTBOUND_CONNECTION",
      description:
        "The workstation generated a simulated outbound connection requiring investigation.",
      sourceSystem: "Employee Workstation",
    },
    {
      eventType: "VPN_LOGIN",
      description:
        "A simulated VPN login was recorded from an unusual source.",
      sourceSystem: "Authentication Server",
    },
  ];

  const noiseTemplates = [
    {
      eventType: "NORMAL_USER_LOGIN",
      description: "Routine simulated user login.",
      sourceSystem: "Authentication Server",
    },
    {
      eventType: "ROUTINE_DNS_REQUEST",
      description: "Routine simulated DNS request.",
      sourceSystem: "Employee Workstation",
    },
    {
      eventType: "NORMAL_EMAIL_ACTIVITY",
      description: "Routine simulated email activity.",
      sourceSystem: "Mail Server",
    },
    {
      eventType: "INTERNAL_NETWORK_ACTIVITY",
      description:
        "Normal simulated internal network activity.",
      sourceSystem: "Employee Workstation",
    },
  ];

  const events: GeneratedEvent[] = [];

  const baseTime = Date.now() - 60 * 60 * 1000;

  for (let i = 0; i < relevantCount; i++) {
    const eventTemplate =
      relevantTemplates[i % relevantTemplates.length]!;

    events.push({
      eventType: eventTemplate.eventType,
      severity:
        i === relevantCount - 1
          ? scenario.severity
          : Severity.MEDIUM,
      sourceSystem: findMatchingSystem(
        systems,
        eventTemplate.sourceSystem
      ),
      user: i % 3 === 0 ? "employee01" : undefined,
      sourceIP:
        i % 2 === 0
          ? generateSimulatedIP(i)
          : undefined,
      destinationIP:
        i % 4 === 0 ? "10.0.0.10" : undefined,
      description: eventTemplate.description,
      metadata: {
        simulated: true,
        eventCategory: "RELEVANT",
      },
      timestamp: new Date(
        baseTime + i * 2 * 60 * 1000
      ),
    });
  }

  for (let i = 0; i < noiseEvents; i++) {
    const eventTemplate =
      noiseTemplates[i % noiseTemplates.length]!;

    events.push({
      eventType: eventTemplate.eventType,
      severity: Severity.LOW,
      sourceSystem: findMatchingSystem(
        systems,
        eventTemplate.sourceSystem
      ),
      user: i % 2 === 0 ? "employee01" : undefined,
      sourceIP: generateSimulatedIP(i + 100),
      description: eventTemplate.description,
      metadata: {
        simulated: true,
        eventCategory: "NOISE",
      },
      timestamp: new Date(
        baseTime +
          (relevantCount + i) * 2 * 60 * 1000
      ),
    });
  }

  return events.sort(
    (a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
  );
}

function generateEvidence(
  scenario: ScenarioInput,
  systems: GeneratedSystem[]
): GeneratedEvidence[] {
  const template =
    scenario.evidenceTemplate as Record<
      string,
      unknown
    >;

  const baseTime = Date.now() - 30 * 60 * 1000;

  const evidence: GeneratedEvidence[] = [];

  if (template.phishingEmail !== undefined) {
    evidence.push({
      type: "PHISHING_EMAIL",
      severity: Severity.HIGH,
      description:
        "Simulated phishing email containing a fraudulent login link.",
      source: findMatchingSystem(
        systems,
        "Mail Server"
      ),
      timestamp: new Date(baseTime),
    });
  }

  if (template.authenticationLogs !== undefined) {
    evidence.push({
      type: "AUTHENTICATION_LOGS",
      severity: Severity.HIGH,
      description:
        "Simulated authentication logs showing unusual account activity.",
      source: findMatchingSystem(
        systems,
        "Authentication Server"
      ),
      timestamp: new Date(
        baseTime + 5 * 60 * 1000
      ),
    });
  }

  if (template.vpnLogs !== undefined) {
    evidence.push({
      type: "VPN_LOGS",
      severity: Severity.MEDIUM,
      description:
        "Simulated VPN logs showing an unusual login source.",
      source: findMatchingSystem(
        systems,
        "Authentication Server"
      ),
      timestamp: new Date(
        baseTime + 10 * 60 * 1000
      ),
    });
  }

  if (template.firewallLogs !== undefined) {
    evidence.push({
      type: "FIREWALL_LOGS",
      severity: Severity.MEDIUM,
      description:
        "Simulated firewall logs showing suspicious outbound traffic.",
      source: findMatchingSystem(
        systems,
        "Employee Workstation"
      ),
      timestamp: new Date(
        baseTime + 15 * 60 * 1000
      ),
    });
  }

  return evidence;
}

export function generateIncidentData(
  scenario: ScenarioInput
): GeneratedIncidentData {
  const systems = generateSystems(
    scenario.affectedSystems
  );

  const events = generateEvents(
    scenario,
    systems
  );

  const evidence = generateEvidence(
    scenario,
    systems
  );

  return {
    systems,
    events,
    evidence,
  };
}