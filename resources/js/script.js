// Retrieve events from localStorage or use an empty array.
let events = JSON.parse(localStorage.getItem("events")) || [];
let editingIndex = null;

/**
 * Convert 24-hour time (e.g., "14:30") to 12-hour American format (e.g., "2:30 PM").
 */
function formatTime(time24) {
  const [hours, minutes] = time24.split(":");
  let h = parseInt(hours, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) {
    h = 12;
  }
  return `${h}:${minutes} ${period}`;
}

// When the event modality changes, show/hide the appropriate field.
function updateLocationOptions(value) {
  document.getElementById("location_field").classList.toggle("hidden", value !== "in-person");
  document.getElementById("remote_url_field").classList.toggle("hidden", value !== "remote");
}

// When clicking "Create Event", reset the modal.
function resetModalForNewEvent() {
  editingIndex = null;
  document.getElementById("event_form").reset();
  document.getElementById("delete_event_btn").style.display = "none";
}

// Save a new or updated event.
function saveEvent() {
  const name = document.getElementById("event_name").value;
  const weekday = document.getElementById("event_weekday").value;
  const time = document.getElementById("event_time").value;
  const modality = document.getElementById("event_modality").value;
  const location = modality === "in-person" ? document.getElementById("event_location").value : null;
  const remote_url = modality === "remote" ? document.getElementById("event_remote_url").value : null;
  const attendees = document.getElementById("event_attendees").value;
  const category = document.getElementById("event_category").value;

  const eventDetails = { name, weekday, time, modality, location, remote_url, attendees, category };

  if (editingIndex !== null) {
    // Update the event being edited.
    events[editingIndex] = eventDetails;
    editingIndex = null;
  } else {
    // Create a new event.
    events.push(eventDetails);
  }

  // Save events to localStorage.
  localStorage.setItem("events", JSON.stringify(events));

  // Reset the form.
  document.getElementById("event_form").reset();

  // Hide the modal using the correct instance.
  let modalEl = document.getElementById("event_modal");
  let modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalEl);
  }
  modalInstance.hide();

  // Refresh the calendar view.
  refreshCalendarUI();
}

// Delete the currently edited event.
function deleteEvent() {
  if (editingIndex !== null) {
    if (confirm("Are you sure you want to delete this event?")) {
      // Remove the event from the array.
      events.splice(editingIndex, 1);
      localStorage.setItem("events", JSON.stringify(events));
      editingIndex = null;

      // Reset the form.
      document.getElementById("event_form").reset();

      // Hide the modal.
      let modalEl = document.getElementById("event_modal");
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.hide();

      // Refresh the calendar view.
      refreshCalendarUI();
    }
  }
}

/**
 * Refresh the calendar UI:
 *  - For each day, reset the container,
 *  - Filter events for that day,
 *  - Sort the day's events by start time (earlier events first),
 *  - Then append the sorted events.
 */
function refreshCalendarUI() {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  weekdays.forEach(day => {
    const container = document.getElementById(day);
    // Reset the container with the day header.
    container.innerHTML = `<div class="h6 text-center py-2 day">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
    
    // Filter events that belong to this day.
    let dayEvents = events.filter(event => event.weekday === day);
    
    // Sort the events by time (assuming HH:MM is zero-padded).
    dayEvents.sort((a, b) => a.time.localeCompare(b.time));
    
    // Append each sorted event to the day's container.
    dayEvents.forEach(event => {
      // Find the index of the event in the main array (needed for editing).
      const index = events.findIndex(e => e === event);
      addEventToCalendarUI(event, index);
    });
  });
}

// On page load, populate the calendar with events.
function loadEvents() {
  refreshCalendarUI();
}

// Create and add an event card to the proper day’s column.
// The event card displays labels and details, and clicking it opens the modal for editing.
function addEventToCalendarUI(event, index) {
  const eventCard = document.createElement("div");
  eventCard.classList.add("event", "border", "rounded", "p-2", "mt-2");

  // Define colors for different categories.
  const colors = { work: "#ffcccc", academic: "#ccffcc", personal: "#ccccff" };
  eventCard.style.backgroundColor = colors[event.category] || "#ffffff";

  // Build the inner HTML string with labels and details.
  let details = `<span style="font-weight:600;">Event Name:</span><br>${event.name}<br>`;

  if (event.time) {
    const formattedTime = formatTime(event.time);
    details += `<span style="font-weight:600;">Event Time:</span><br>${formattedTime}<br>`;
  }
  
  if (event.modality) {
    details += `<span style="font-weight:600;">Event Modality:</span><br>${event.modality}`;
  }
  
  if (event.modality === "in-person" && event.location) {
    details += `<br><span style="font-weight:600;">Event Location:</span><br>${event.location}`;
  } else if (event.modality === "remote" && event.remote_url) {
    details += `<br><span style="font-weight:600;">Event Location:</span><br>${event.remote_url}`;
  }
  
  if (event.attendees && event.attendees.trim() !== "") {
    details += `<br><span style="font-weight:600;">Attendees:</span><br>${event.attendees}`;
  }
  
  eventCard.innerHTML = details;

  // Clicking the event card opens the modal for editing.
  eventCard.addEventListener("click", () => editEvent(index));

  document.getElementById(event.weekday).appendChild(eventCard);
}

// Fill in the form with the event details so it can be edited.
function editEvent(index) {
  const event = events[index];
  editingIndex = index;
  
  // Pre-fill form fields with the event's current values.
  document.getElementById("event_name").value = event.name;
  document.getElementById("event_weekday").value = event.weekday;
  document.getElementById("event_time").value = event.time;
  document.getElementById("event_modality").value = event.modality;
  
  if (event.modality === "in-person") {
    document.getElementById("event_location").value = event.location;
    updateLocationOptions("in-person");
  } else if (event.modality === "remote") {
    document.getElementById("event_remote_url").value = event.remote_url;
    updateLocationOptions("remote");
  }
  
  document.getElementById("event_attendees").value = event.attendees;
  document.getElementById("event_category").value = event.category;
  
  // Show the delete button when editing.
  document.getElementById("delete_event_btn").style.display = "inline-block";
  
  // Open the modal for editing.
  const modalEl = document.getElementById("event_modal");
  const modalInstance = new bootstrap.Modal(modalEl);
  modalInstance.show();
}

// When the modal is closed, reset the form and hide the delete button.
document.getElementById("event_modal").addEventListener("hidden.bs.modal", function () {
  document.getElementById("event_form").reset();
  document.getElementById("delete_event_btn").style.display = "none";
  editingIndex = null;
});

// Load events when the document is ready.
document.addEventListener("DOMContentLoaded", loadEvents);
