/* Netlify Forms: URL-encoded submission en duidelijke feedback */
document.getElementById("infoRequestForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  const status = document.getElementById("infoRequestStatus");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Even versturen...";
  status.classList.add("hidden");
  status.classList.remove("is-error");
  try {
    const response = await fetch("/", {
      method: "POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded"},
      body: new URLSearchParams(new FormData(form)).toString()
    });
    if (!response.ok) throw new Error("Form submit failed: " + response.status);
    form.reset();
    status.textContent = "Bedankt! Je aanvraag is ontvangen. Je ontvangt de mogelijkheden per e-mail.";
  } catch (error) {
    status.textContent = "Versturen is niet gelukt. Probeer het opnieuw of mail naar info@budgetpodcast.nl.";
    status.classList.add("is-error");
  } finally {
    button.disabled = false;
    button.textContent = original;
    status.classList.remove("hidden");
  }
});
