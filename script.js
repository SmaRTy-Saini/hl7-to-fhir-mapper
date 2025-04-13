
function mapHL7toFHIR() {
    const raw = document.getElementById("hl7Input").value.trim();
    const lines = raw.split(/\r?\n/);
    const segments = {};

    for (const line of lines) {
        const fields = line.split('|');
        const seg = fields[0];
        if (!segments[seg]) segments[seg] = [];
        segments[seg].push(fields);
    }

    const outputDiv = document.getElementById("fhirOutput");
    outputDiv.innerHTML = '';

    // Map PID to FHIR Patient
    if (segments.PID) {
        const pid = segments.PID[0];
        const patient = {
            resourceType: "Patient",
            id: pid[3] || "Unknown",
            name: [{
                family: (pid[5] || "").split('^')[0],
                given: [(pid[5] || "").split('^')[1] || ""]
            }],
            gender: pid[8] === 'M' ? 'male' : (pid[8] === 'F' ? 'female' : 'unknown'),
            birthDate: pid[7] || ""
        };
        renderFHIR(patient, "Patient");
    }

    // Map PV1 to FHIR Encounter
    if (segments.PV1) {
        const pv1 = segments.PV1[0];
        const encounter = {
            resourceType: "Encounter",
            id: "encounter-" + Date.now(),
            status: "finished",
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "AMB"
            },
            location: [{
                location: {
                    display: pv1[3] || "Unknown"
                }
            }]
        };
        renderFHIR(encounter, "Encounter");
    }

    // Map OBX to FHIR Observation
    if (segments.OBX) {
        segments.OBX.forEach((obx, index) => {
            const observation = {
                resourceType: "Observation",
                id: "observation-" + index,
                status: "final",
                code: {
                    text: obx[3] || "Unknown Code"
                },
                valueQuantity: {
                    value: parseFloat(obx[5]) || 0,
                    unit: obx[6] || "unit"
                }
            };
            renderFHIR(observation, "Observation");
        });
    }
}

function renderFHIR(resource, type) {
    const container = document.createElement('div');
    container.innerHTML = \`
        <h3>\${type}</h3>
        <pre>\${JSON.stringify(resource, null, 2)}</pre>
        <button class="download-btn" onclick='downloadFHIR(\${JSON.stringify(JSON.stringify(resource))}, "\${type}.json")'>Download \${type}</button>
    \`;
    document.getElementById('fhirOutput').appendChild(container);
}

function downloadFHIR(content, filename) {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
