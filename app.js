const SUPABASE_URL = "https://github.com/saquibrahman7/ROADTRIP-OS/blob/main/app.js";
const SUPABASE_KEY = "sb_publishable_MpwUByDTMw7W9Vuk0F2yyw_f-fr0_f2";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function createTrip() {

  const tripName = prompt("Trip name:");
  if (!tripName) return;

  const destination = prompt("Destination:");
  if (!destination) return;

  const joinCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const { data, error } = await supabaseClient
    .from("trips")
    .insert([
      {
        name: tripName,
        destination: destination,
        join_code: joinCode
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    alert("Could not create trip.");
    return;
  }

  alert(
    `TRIP CREATED!\n\n` +
    `Trip: ${data.name}\n` +
    `Destination: ${data.destination}\n\n` +
    `JOIN CODE: ${data.join_code}`
  );
}

async function joinTrip() {

  const code = prompt("Enter trip code:");
  if (!code) return;

  const { data, error } = await supabaseClient
    .from("trips")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .single();

  if (error || !data) {
    alert("Trip not found.");
    return;
  }

  const name = prompt("Your name:");
  if (!name) return;

  const { error: memberError } = await supabaseClient
    .from("trip_members")
    .insert([
      {
        trip_id: data.id,
        name: name
      }
    ]);

  if (memberError) {
    console.error(memberError);
    alert("Could not join trip.");
    return;
  }

  alert(
    `JOINED!\n\n` +
    `${data.name}\n` +
    `${data.destination}`
  );
}
