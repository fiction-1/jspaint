// ============================================================
//  fromflyng — GitHub Pages Frontend
//  Drop this into your existing JS file, or include as a
//  separate <script src="fromflyng.js"></script> in your HTML
// ============================================================

import { $DialogWindow } from "./$ToolWindow.js";
import { write_image_file } from "./functions.js";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3PWlFf0VZLbEgUNRMKni-CJC83b0wlGYsTvj8viygOeQhJ9inO3l1fQQDT4n5cJVaYQ/exec"; // ← paste your deployed Apps Script URL here
const fromflyng_email_address = "fromflyng@gmail.com";

// ------------------------------------------------------------
//  Sends the current canvas image to fromflyng
//  Uses native share sheet on mobile, silent POST on desktop
// ------------------------------------------------------------
export const send_current_image_to_fromflyng = async (name, email) => {
  return new Promise((resolve) => {
    write_image_file(main_canvas, "image/png", async (blob) => {

      // ── Mobile: try native OS share sheet first ──────────────
      try {
        const file = new File([blob], "fromflyng.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Send to fromflyng",
            text: `Sending this image to ${fromflyng_email_address}`,
            files: [file],
          });
          resolve();
          return;
        }
      } catch (shareError) {
        console.warn("Native share unavailable, falling back to upload.", shareError);
      }

      // ── Desktop: convert blob → base64, POST to Apps Script ──
      try {
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64 = reader.result.split(",")[1]; // strip data URL prefix

          const params = new URLSearchParams();
          params.append("image", base64);
          params.append("name", name || "Anonymous");
          params.append("email", email || "");

          // no-cors is required for cross-origin POST to Apps Script
          // — we can't read the response, but the script still executes
          await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: params,
          });

          show_success_message();
          resolve();
        };

        reader.onerror = () => {
          console.error("FileReader failed.");
          show_error_message();
          resolve();
        };

        reader.readAsDataURL(blob);

      } catch (uploadError) {
        console.error("Upload failed:", uploadError);
        show_error_message();
        resolve();
      }
    });
  });
};

// ------------------------------------------------------------
//  Dialog — collects name + email, then triggers the send
// ------------------------------------------------------------
export const show_send_to_fromflyng_dialog = () => {
  const $window = $DialogWindow("Are you ready to send this to fromflyng?");

  $window.$main.css({
    padding: "20px",
    fontSize: "14px",
    textAlign: "left",
    minWidth: "300px",
  });

  // ── Name field ───────────────────────────────────────────
  const $nameLabel = $("<label>").text("Your name").css({ display: "block", marginBottom: "4px" });
  const $nameInput = $("<input>")
    .attr({ type: "text", placeholder: "Bebe Goss" })
    .css({ width: "100%", marginBottom: "12px", padding: "6px", boxSizing: "border-box" });

  // ── Email field ──────────────────────────────────────────
  const $emailLabel = $("<label>").text("Your email").css({ display: "block", marginBottom: "4px" });
  const $emailInput = $("<input>")
    .attr({ type: "email", placeholder: "bebegoss@example.com" })
    .css({ width: "100%", marginBottom: "16px", padding: "6px", boxSizing: "border-box" });

  // ── Status message ───────────────────────────────────────
  const $status = $("<p>").css({ margin: "0 0 12px", color: "#555", minHeight: "20px" });

  // ── Send button ──────────────────────────────────────────
  const $sendButton = $window.$Button("send", async () => {
    const name = $nameInput.val().trim();
    const email = $emailInput.val().trim();

    if (!name) {
      $status.text("Please enter your name.").css("color", "red");
      return;
    }
    if (!email || !email.includes("@")) {
      $status.text("Please enter a valid email address.").css("color", "red");
      return;
    }

    $sendButton.prop("disabled", true);
    $status.text("sending…").css("color", "#555");

    await send_current_image_to_fromflyng(name, email);
    $window.close();

  }, { type: "button" });

  $sendButton.css({ minWidth: "80px", marginRight: "8px" });

  // ── Cancel button ────────────────────────────────────────
  const $cancelButton = $window.$Button("cancel", () => {
    $window.close();
  }, { type: "button" });

  // ── Assemble dialog ──────────────────────────────────────
  $window.$main.append(
    $nameLabel, $nameInput,
    $emailLabel, $emailInput,
    $status,
    $sendButton, $cancelButton
  );

  $window.center();
};

// ------------------------------------------------------------
//  Helpers — swap these out for whatever UI pattern you use
// ------------------------------------------------------------
function show_success_message() {
  alert("Image sent to fromflyng! We'll be in touch.");
}

function show_error_message() {
  alert("Something went wrong sending your image. Please try again.");
}