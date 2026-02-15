import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanError, elementId = "reader" }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(elementId, {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            showTorchButtonIfSupported: true,
        }, false);

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [onScanSuccess, onScanError, elementId]);

    return (
        <div id={elementId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
    );
};

export default QRScanner;
