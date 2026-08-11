// ==================================================
// SUPABASE
// ==================================================

const SUPABASE_URL =
  "https://erjuaqrbcmnxdvasolfn.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_MpwUByDTMw7W9Vuk0F2yyw_f-fr0_f2";


const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


let currentTrip = null;


// ==================================================
// CREATE TRIP
// ==================================================

async function createTrip() {

  const tripName =
    prompt("Trip name:");

  if (!tripName) {
    return;
  }


  const destination =
    prompt("Destination:");

  if (!destination) {
    return;
  }


  const joinCode =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();


  const { data, error } =
    await supabaseClient
      .from("trips")
      .insert([
        {
          name: tripName.trim(),
          destination: destination.trim(),
          join_code: joinCode
        }
      ])
      .select()
      .single();


  if (error) {

    console.error("CREATE TRIP ERROR:", error);

    alert(
      "Could not create trip.\n\n" +
      error.message
    );

    return;
  }


  currentTrip = data;


  // Add creator

  const { error: memberError } =
    await supabaseClient
      .from("trip_members")
      .insert([
        {
          trip_id: currentTrip.id,
          name: "Trip Creator"
        }
      ]);


  if (memberError) {

    console.error(
      "MEMBER ERROR:",
      memberError
    );

    alert(
      "Trip created, but creator could not be added.\n\n" +
      memberError.message
    );

    return;
  }


  // SHOW DASHBOARD

  showDashboard();

}


// ==================================================
// JOIN TRIP
// ==================================================

async function joinTrip() {

  const code =
    prompt(
      "Enter trip code:"
    );


  if (!code) {
    return;
  }


  const cleanCode =
    code.trim().toUpperCase();


  const { data, error } =
    await supabaseClient
      .from("trips")
      .select("*")
      .eq(
        "join_code",
        cleanCode
      )
      .single();


  if (error || !data) {

    console.error(
      "JOIN ERROR:",
      error
    );

    alert(
      "Trip not found."
    );

    return;
  }


  const name =
    prompt(
      "Your name:"
    );


  if (!name) {
    return;
  }


  currentTrip = data;


  const { error: memberError } =
    await supabaseClient
      .from("trip_members")
      .insert([
        {
          trip_id: currentTrip.id,
          name: name.trim()
        }
      ]);


  if (memberError) {

    console.error(
      "MEMBER ERROR:",
      memberError
    );

    alert(
      "Could not join trip.\n\n" +
      memberError.message
    );

    return;
  }


  showDashboard();

}


// ==================================================
// SHOW DASHBOARD
// ==================================================

function showDashboard() {

  document.getElementById(
    "home"
  ).style.display = "none";


  document.getElementById(
    "dashboard"
  ).style.display = "block";


  // Trip name

  document.getElementById(
    "tripTitle"
  ).textContent =
    currentTrip.name;


  // Destination

  document.getElementById(
    "tripDestination"
  ).textContent =
    currentTrip.destination;


  // JOIN CODE

  document.getElementById(
    "tripCode"
  ).textContent =
    currentTrip.join_code;


  // Members

  loadMembers();

}


// ==================================================
// LOAD MEMBERS
// ==================================================

async function loadMembers() {

  if (!currentTrip) {
    return;
  }


  const { data, error } =
    await supabaseClient
      .from("trip_members")
      .select("*")
      .eq(
        "trip_id",
        currentTrip.id
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "LOAD MEMBERS ERROR:",
      error
    );

    return;
  }


  const list =
    document.getElementById(
      "membersList"
    );


  list.innerHTML = "";


  if (
    !data ||
    data.length === 0
  ) {

    list.innerHTML =
      "<p>No members yet.</p>";

    return;
  }


  data.forEach(
    member => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "member";


      div.textContent =
        "🚗 " +
        member.name;


      list.appendChild(
        div
      );

    }
  );

}


// ==================================================
// GO HOME
// ==================================================

function goHome() {

  document.getElementById(
    "dashboard"
  ).style.display =
    "none";


  document.getElementById(
    "home"
  ).style.display =
    "block";

}
