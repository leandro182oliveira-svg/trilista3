// qrcode.js - Versao simples para testar QR com logo central
const QRCodeManager = (function() {
    let qr = null;
    const QR_PREVIEW_SIZE = 320;
    const QR_DOWNLOAD_SIZE = 2048;

    function getCurrentStoreDbKey() {
        return window.Auth && typeof window.Auth.getCurrentUserDBKey === 'function'
            ? window.Auth.getCurrentUserDBKey()
            : '';
    }

    function getPublicStoreUrl() {
        const dbKey = getCurrentStoreDbKey();
        const url = new URL('loja.html', window.location.href);

        if (dbKey) {
            url.searchParams.set('store', dbKey);
        }

        return url.toString();
    }

    function generateStyledQR() {
        const modal = document.getElementById('qrCodeModal');
        const container = document.getElementById('qrcodePreview');
        const downloadBtn = document.getElementById('downloadQRBtn');
        const publicStoreUrl = getPublicStoreUrl();

        if (!container) return;
        if (modal) modal.style.display = 'flex';

        container.innerHTML = '<div id="qr" style="display:flex; justify-content:center; width:100%;"></div>';

        qr = new QRCodeStyling({
            width: QR_PREVIEW_SIZE,
            height: QR_PREVIEW_SIZE,
            data: publicStoreUrl || 'sem-link',
            qrOptions: {
                errorCorrectionLevel: 'H'
            },
            image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 8,
                imageSize: 0.35,
                hideBackgroundDots: true
            },
            dotsOptions: {
                type: 'dots'
            },
            cornersSquareOptions: {
                type: 'extra-rounded'
            },
            cornersDotOptions: {
                type: 'dot'
            }
        });

        qr.append(document.getElementById('qr'));

        if (downloadBtn) {
            downloadBtn.style.display = 'inline-flex';
        }
    }

    function downloadQR() {
        if (!qr) return;
        const publicStoreUrl = getPublicStoreUrl();
        const highDefinitionQr = new QRCodeStyling({
            width: QR_DOWNLOAD_SIZE,
            height: QR_DOWNLOAD_SIZE,
            data: publicStoreUrl || 'sem-link',
            qrOptions: {
                errorCorrectionLevel: 'H'
            },
            image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 8,
                imageSize: 0.35,
                hideBackgroundDots: true
            },
            dotsOptions: {
                type: 'dots'
            },
            cornersSquareOptions: {
                type: 'extra-rounded'
            },
            cornersDotOptions: {
                type: 'dot'
            }
        });

        highDefinitionQr.download({
            name: 'qr-code-hd',
            extension: 'png'
        });
    }

    function copyPageLink() {
        alert('QR temporariamente sem ligacao com a loja.');
    }

    return {
        generateStyledQR,
        downloadQR,
        copyPageLink
    };
})();

window.QRCodeManager = QRCodeManager;
