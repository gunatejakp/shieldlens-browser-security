/**
 * ShieldLens — Test Playground Controller
 * Generates harmless mock downloads and simulated scenarios.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Helper to trigger harmless blob download
  function triggerHarmlessDownload(filename, contentStr = 'ShieldLens Harmless Test Content', mimeType = 'text/plain') {
    const blob = new Blob([contentStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // FileGuard Test Buttons
  document.getElementById('btn-dl-pdf')?.addEventListener('click', () => {
    triggerHarmlessDownload('AnnualReport.pdf', '%PDF-1.4 Harmless Test PDF', 'application/pdf');
  });

  document.getElementById('btn-dl-img')?.addEventListener('click', () => {
    triggerHarmlessDownload('Photo.jpg', 'Harmless Image Data', 'image/jpeg');
  });

  document.getElementById('btn-dl-audio')?.addEventListener('click', () => {
    triggerHarmlessDownload('Track.mp3', 'Harmless Audio Data', 'audio/mpeg');
  });

  document.getElementById('btn-dl-video')?.addEventListener('click', () => {
    triggerHarmlessDownload('Presentation.mp4', 'Harmless Video Data', 'video/mp4');
  });

  document.getElementById('btn-dl-zip')?.addEventListener('click', () => {
    triggerHarmlessDownload('ProjectBackup.zip', 'Harmless ZIP Archive Data', 'application/zip');
  });

  // Mismatch Scenario: Button text says "Download LectureNotes.pdf", but triggers LectureNotes.exe
  document.getElementById('btn-dl-mismatch-exe')?.addEventListener('click', () => {
    triggerHarmlessDownload('LectureNotes.exe', 'Harmless Test Binary Payload', 'application/x-msdownload');
  });

  // Double Extension Scenario: Disguised as Notes.pdf.exe
  document.getElementById('btn-dl-double-ext')?.addEventListener('click', () => {
    triggerHarmlessDownload('StudyGuide.pdf.exe', 'Harmless Test Binary Payload', 'application/x-msdownload');
  });

  // Category Mismatch Scenario: Button says "ProfilePic.jpg", triggers ProfilePic.zip
  document.getElementById('btn-dl-mismatch-zip')?.addEventListener('click', () => {
    triggerHarmlessDownload('ProfilePic.zip', 'Harmless Zip Data', 'application/zip');
  });

  // Test 17: Unexpected Download (User clicks "Play Video", but triggers setup.exe download)
  document.getElementById('btn-unrelated-click')?.addEventListener('click', () => {
    triggerHarmlessDownload('setup.exe', 'Harmless Test Payload', 'application/x-msdownload');
  });

  // Test 18: Automatic Drive-by Download (Triggered after 3s timer without user click)
  document.getElementById('btn-trigger-auto-dl')?.addEventListener('click', (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Drive-by Download starting in 3s...';
    
    setTimeout(() => {
      triggerHarmlessDownload('automatic_update.exe', 'Harmless Auto Download Payload', 'application/x-msdownload');
      btn.disabled = false;
      btn.textContent = 'Trigger Drive-by Download in 3s';
    }, 3000);
  });
});
