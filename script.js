function scanMessage() {
    const message = document.getElementById('messageInput').value.toLowerCase();
    const resultDiv = document.getElementById('result');
    const severityDiv = document.getElementById('severity');

    const phishingIndicators = {
        high: ['urgent', 'immediately', 'suspended', 'permanent closure', 'verify your account', 'click here', 'account has been suspended'],
        medium: ['suspicious activity', 'security update', 'prize claim', 'reward', 'account verification', 'login to your account'],
        low: ['free', 'win', 'bonus', 'exclusive offer', 'congratulations']
    };

    let severity = 'low';
    let foundIndicators = [];

    for (let keyword of phishingIndicators.high) {
        if (message.includes(keyword)) {
            severity = 'high';
            foundIndicators.push(keyword);
            break;
        }
    }

    if (severity === 'low') {
        for (let keyword of phishingIndicators.medium) {
            if (message.includes(keyword)) {
                severity = 'medium';
                foundIndicators.push(keyword);
                break;
            }
        }
    }

    if (severity === 'low' && foundIndicators.length === 0) {
        for (let keyword of phishingIndicators.low) {
            if (message.includes(keyword)) {
                foundIndicators.push(keyword);
                break;
            }
        }
    }

    // Display result
    if (severity === 'high' || severity === 'medium') {
        resultDiv.textContent = severity === 'high'
            ? '⚠️ Warning: This message looks like a high-severity phishing attempt!'
            : '⚠️ This message seems like a medium-severity phishing attempt.';
        resultDiv.className = 'result phishing';

        severityDiv.textContent = `Severity Level: ${severity.charAt(0).toUpperCase() + severity.slice(1)}`;
        severityDiv.style.display = 'block';
    } else {
        resultDiv.textContent = '✅ This message appears to be safe.';
        resultDiv.className = 'result safe';

        severityDiv.textContent = '';
        severityDiv.style.display = 'none';
    }

    resultDiv.style.display = 'block';
}


// Reset form
function resetForm() {
    document.getElementById('messageInput').value = '';
    document.getElementById('result').textContent = '';
    document.getElementById('result').className = 'result';
    document.getElementById('result').style.display = 'none';

    const severityDiv = document.getElementById('severity');
    severityDiv.textContent = '';
    severityDiv.className = 'severity';
    severityDiv.style.display = 'none';

    document.getElementById('fileInput').value = '';
}

// Handle email file uploads
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const typedarray = new Uint8Array(e.target.result);

            pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
                let textPromises = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    textPromises.push(pdf.getPage(i).then(page => page.getTextContent()));
                }

                Promise.all(textPromises).then(pages => {
                    let text = '';
                    pages.forEach(content => {
                        content.items.forEach(item => {
                            text += item.str + ' ';
                        });
                    });

                    document.getElementById('messageInput').value = text.trim();
                });
            });
        };

        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            const plainText = extractPlainText(contents);
            document.getElementById('messageInput').value = plainText;
        };
        reader.readAsText(file);
    }
}


// Basic plain text extraction from .eml files
function extractPlainText(rawEmail) {
    const lines = rawEmail.split(/\r?\n/);
    const bodyStart = lines.findIndex(line => line.trim() === '');
    const bodyLines = lines.slice(bodyStart + 1);

    return bodyLines.join('\n').replace(/=([A-F0-9]{2})/g, (match, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    );
}
