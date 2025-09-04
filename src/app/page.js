"use client";

import { useEffect, useState } from "react";
import app from "../../lib/firebase";
import '../../styles/global.css';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import FilterDropdown from '../../components/FilterDropdown';
import Loader from '../../components/Loader';
import Toggle from "../../components/Toggle";
import NavBar from "../../components/NavBar";
import OpportunityModal from "../../components/OpportunityModal";
import LocationModal from "../../components/LocationModal";


// Tag coloring helper
function getTagColor(tag) {
  const colors = {
    "Health/Med": "bg-red-200 text-red-800",
    "Journalism": "bg-purple-200 text-purple-800",
    "Business": "bg-blue-200 text-blue-800",
    "Law/Legal": "bg-yellow-200 text-yellow-800",
    "Tech": "bg-cyan-200 text-cyan-800",
    "Environment": "bg-green-600 text-white",
    "Community": "bg-orange-200 text-orange-800",
    "STEM": "bg-teal-200 text-teal-800",
    "Education": "bg-teal-200 text-teal-800",
    "default": "bg-gray-200 text-gray-800",

    //Opportunity Types:
    "Internship": "bg-red-700 text-white",
    "Workshop": "bg-teal-600 text-white",
    "Event": "bg-purple-500 text-white",
    "Volunteering": "bg-blue-700 text-white",

  };
  return colors[tag] || colors["default"];
}

export default function Home() {
  // All hooks/state here
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false); // Toggles view
  const [opportunities, setOpportunities] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
  const [selectedOpportunityTypes, setSelectedOpportunityTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpp, setModalOpp] = useState(null);
  const [sortKey, setSortKey] = useState('date'); // e.g. 'name', 'organization', 'date'
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);


  // Email export modal - might have to edit or add/delete ltr
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  //const [statusMsg, setStatusMsg] = useState<string | null>(null);

  //Geo Modal - Might have to adjust
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [userCoords, setUserCoords] = useState(null);          // { lat, lng }
  const [userLocationLabel, setUserLocationLabel] = useState(""); // e.g., "48104" or "Austin, TX"
  const [hover, setHover] = useState(false); //Used in location button, but may be useful in other areas






  // Dropdown options
  const industryOptions = [
    "Business", "Community", "Education", "Environment",
    "Health/Med", "Journalism", "Law/Legal", "Tech", "STEM"
  ];
  const ageGroupOptions = [
    "Elementary School", "Middle School", "High School", "College", "18+", "All Ages"
  ];
  const opportunityTypeOptions = [
    "Internship", "Workshop", "Event", "Volunteering"
  ];

  function toggleFavorite(id) {
    setFavorites(favs =>
      favs.includes(id)
        ? favs.filter(f => f !== id)
        : [...favs, id]
    );
  }

  function exportFavoritesToCSV() {
    const favs = filteredOpportunities.filter(opp => favorites.includes(opp.id));
    if (favs.length === 0) {
      alert("No favorites to export!");
      return;
    }
    const header = ["Name", "Organization", "Location", "Tags"];
    const rows = favs.map(opp => [
      `"${opp.name}"`,
      `"${opp.organization}"`,
      `"${opp.location}"`,
      `"${(opp.tags || []).join(', ')}"`
    ]);
    const csvContent = [
      header.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "favorites.csv";
    link.click();
  }

  function exportFavoritesWithEmail(){
    //const email = window.prompt("Enter your email to receive your favorites CSV:"); //using window prompt
    //use modal
    setEmailModalOpen(true);

  }

  // Fetch data from Firestore on mount
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "opportunities"));
      const data = querySnapshot.docs.map(doc => {
      const d = doc.data();
      //console.log("remoteType from d:", d["Is the opportunity remote or in-person:"]);
      console.log("d keys:", Object.keys(d));

      const lat = parseFloat(d["Latitude"]);
      const lng = parseFloat(d["Longitude"]);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return {
          id: doc.id,
          name: d["What is the name of your opportunity?"] || "",
          organization: d["Organization Name"] || "",
          location: d["City, State"] || "",
          // ageGroup: d["What is the suggested age group?"] || "",
          ageGroups: d["What is the suggested age group?"] || ""
          ? d["What is the suggested age group?"].split(",").map(ageGroup => ageGroup.trim()).filter(Boolean)
            : [],
          
          opportunityType: d["Opportunity Type"] || "",
          tags: d["Industry Tags"]
            ? d["Industry Tags"].split(",").map(tag => tag.trim()).filter(Boolean)
            : [],
          description: d["Detailed description of the event"] || "",
          contact: d["E-mail Address"] || "",

          date: d["EventDateTime"]
            ? d["EventDateTime"].split(" ")[0] // This will be "2025-11-01"
            : "",

          dateTime: d["EventDateTime"]
            ? new Date(d["EventDateTime"].replace(" ", "T"))
                .toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })
            : "",

          remoteType: d["Is the opportunity remote or in-person"] || "",

          recurrence: d["Is the event recurring?"] || "",

          coordinates: hasCoords ? { lat, lng } : null
          
        };
      });

      console.log("Fetched opportunities:", data); // THIS ONE ONLY


      setOpportunities(data);
      
      setDataLoaded(true); 
    };
    fetchData();
  }, []);

  if (showLoader) {
    return (
      <Loader
        loadingDone={dataLoaded}         // ← pass dataLoaded here
        onFinish={() => setShowLoader(false)}
      />
    );
  }

  //  ****
  //  LOCATION HELPER FUNCTIONS
  //  ****
  function haversineMiles(a, b) {
    if (!a || !b) return null;
    const R = 6371; // km
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(h));
    return km * 0.621371; // -> miles
  }

  function clearSavedLocation() {
    setUserLocationLabel("");
    setUserCoords(null);
    localStorage.removeItem("yc_user_label");
    localStorage.removeItem("yc_user_coords");
    // reset sorting if sorting by distance
    setSortKey("date"); setSortDirection("asc");
  }

  // Filtered list
  const filteredOpportunities = opportunities.filter(opp =>
    (selectedIndustries.length === 0 || opp.tags.some(tag => selectedIndustries.includes(tag))) &&
    //(selectedAgeGroups.length === 0 || selectedAgeGroups.includes(opp.ageGroup)) &&
    (selectedAgeGroups.length === 0 || opp.ageGroups.some(age => selectedAgeGroups.includes(age))) &&
    (selectedOpportunityTypes.length === 0 || selectedOpportunityTypes.includes(opp.opportunityType)) &&
    (!showRemoteOnly || opp.remoteType === "Remote") && 
    (
      opp.name.toLowerCase().includes(search.toLowerCase()) ||
      opp.organization.toLowerCase().includes(search.toLowerCase()) ||
      opp.location.toLowerCase().includes(search.toLowerCase())
    )
  );

  const opportunitiesToDisplay = showOnlyFavorites
    ? filteredOpportunities.filter(opp => favorites.includes(opp.id))
    : filteredOpportunities;

  //Sorted Lists
  const sortedOpportunities = [...opportunitiesToDisplay].sort((a, b) => {
    if (!sortKey) return 0; // No sort
    let valA = a[sortKey];
    let valB = b[sortKey];


    //LOCATION
    if (sortKey === "distance") {
      // missing distances go to the bottom
      const dA = userCoords && a.coordinates ? haversineMiles(userCoords, a.coordinates) : Infinity;
      const dB = userCoords && b.coordinates ? haversineMiles(userCoords, b.coordinates) : Infinity;
      return sortDirection === "asc" ? dA - dB : dB - dA;
    }
    


    // For date, convert to Date object
    if (sortKey === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = valA ? valA.toString().toLowerCase() : "";
      valB = valB ? valB.toString().toLowerCase() : "";
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }


  
  // UI
  return (
          <div className="bg-purple-50 min-h-screen p-4 font-segoe">

          {/* NEW: NavBar */}
          {/* <NavBar
            favoritesCount={favorites.length}
            showOnlyFavorites={showOnlyFavorites}
            setShowOnlyFavorites={setShowOnlyFavorites}
            onExportCSV={exportFavoritesToCSV}
            onOpenEmailModal={() => setEmailModalOpen(true)}
          /> */}


          <div className="max-w-full mx-auto px-4">
            
            {/* Header: Logo + Search + Filters */}
            <div className="flex items-center mb-4">
              {/* Logo */}
              <div className="w-20 h-20 flex-shrink-0 mr-4">
                <img src="/logo.webp" alt="Logo" className="w-full h-full object-contain" />
              </div>
              {/* Search bar */}
              <div className="relative flex-1 mr-4">
                <svg
                  className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 border rounded-full text-sm w-full bg-white text-lg text-gray-700"
                  placeholder="Search by Name, Location, Age Group, Industry, or Opportunity Type"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Dropdowns */}
              <div className="flex gap-4">
                <FilterDropdown
                  label="Select Industry"
                  options={industryOptions}
                  selected={selectedIndustries}
                  setSelected={setSelectedIndustries}
                />
                <FilterDropdown
                  label="Select Age Group"
                  options={ageGroupOptions}
                  selected={selectedAgeGroups}
                  setSelected={setSelectedAgeGroups}
                />
                <FilterDropdown
                  label="Select Opportunity Type"
                  options={opportunityTypeOptions}
                  selected={selectedOpportunityTypes}
                  setSelected={setSelectedOpportunityTypes}
                />
              </div>
            </div>

            {/* Action Buttons: Show All, Favorites, Export, Distance */}
            <div className="flex items-center gap-6 mb-8 mx-auto w-fit"> {/* adjust ml-40 as needed */}
              <button
                className={`bg-purple-700 hover:bg-purple-800 cursor-pointer text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition opacity-80 ${
                  !showOnlyFavorites ? '' : 'opacity-100'
                }`}
                onClick={() => setShowOnlyFavorites(false)}
              >
                Show All Opportunities
              </button>
              <button
                className={`bg-purple-700 hover:bg-purple-800 cursor-pointer text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition opacity-80${
                  showOnlyFavorites ? '' : 'opacity-100'
                }`}
                onClick={() => setShowOnlyFavorites(true)}
              >
                Favorites
              </button>
              <button
                className="bg-red-700 hover:bg-red-800 cursor-pointer text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition"
                onClick={exportFavoritesToCSV}
                // onClick={exportFavoritesWithEmail}

              >
                Export Favorites
              </button>
              {/*
              <label className="ml-6 text-lg flex items-center gap-2">
                Enable Distance Display
                <input type="checkbox" />
              </label>
              */}

              <button
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}

                className={userLocationLabel ? 
                  "bg-green-300 hover:bg-green-100 border border-green-500 text-gray-800 text-sm font-bold h-9 w-50 py-1.5 px-4 rounded-full cursor-pointer" 
                  : "bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 text-sm font-bold h-9 py-1.5 px-4 rounded-full cursor-pointer"}
                onClick={() => {
                  if (userLocationLabel?.trim()){
                    clearSavedLocation();
                  }
                  else{
                    setGeoError("");
                    setLocationInput(userLocationLabel || "");
                    setLocationModalOpen(true);
                  }
                }}
              >
                {/* {hover
                  ? (userLocationLabel?.trim() ? "Reset Location" : "Set Location")
                  : (userLocationLabel?.trim() ? `Location: ${userLocationLabel}` : "Set Location")} */}
                {hover
                  ? (userLocationLabel?.trim() ? "Reset Location" : "Set Location")
                  : (userLocationLabel?.trim()
                      ? `Location: ${
                          ((userLocationLabel ?? "").trim().length > 13)
                            ? ((userLocationLabel ?? "").trim().slice(0, 13) + "...")
                            : ((userLocationLabel ?? "").trim())
                        }`
                      : "Set Location")
                }
                
              </button>


              <div className="flex items-center gap-2">
                <Toggle checked={showRemoteOnly} onChange={setShowRemoteOnly} />
                <span className="text-base font-semibold text-gray-700 select-none">
                  Remote Only
                </span>
              </div>

              
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-purple-700">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-white text-center">FAVORITE</th>
                    {/*<th className="px-4 py-3 text-xs font-bold text-white">OPPORTUNITY NAME</th>*/}
                    <th
                      className="px-4 py-3 text-xs font-bold text-white cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      OPPORTUNITY NAME {sortKey === "name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-white">OPPORTUNITY TYPE</th> 
                    {/* <th className="px-4 py-3 text-xs font-bold text-white">ORGANZATON</th> */}
                    <th
                      className="px-4 py-3 text-xs font-bold text-white cursor-pointer"
                      onClick={() => handleSort("organization")}
                    >
                      ORGANIZATION {sortKey === "organization" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-white">LOCATION</th>
                    {/* <th className="px-4 py-3 text-xs font-bold text-white">DATE</th> */}
                    <th
                      className="px-4 py-3 text-xs font-bold text-white cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      DATE {sortKey === "date" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-white">TAGS</th>
                    <th className="px-4 py-3 text-xs font-bold text-white">MORE INFO</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOpportunities.map(opp => (
                    <tr key={opp.id} className="border-b border-gray-300">
                      <td className="px-4 py-4 text-center cursor-pointer text-xl">
                        <span
                          onClick={() => toggleFavorite(opp.id)}
                          style={{ userSelect: "none" }}
                          aria-label={favorites.includes(opp.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          {favorites.includes(opp.id) ? "❤️" : "🤍"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-900 font-bold text-sm">{opp.name}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getTagColor(opp.opportunityType)}`}>
                          {opp.opportunityType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-900 font-bold text-sm">{opp.organization}</td>
                      
                      
                      {/* <td className="px-4 py-4 text-gray-900 font-bold text-sm flex items-center gap-1">
                        {opp.location}
                        {opp.remoteType === "Remote" && (
                          <>
                            <span className="ml-0 text-xs font-semibold text-blue-600"></span>
                            <img src="/computer.svg" alt="Remote" className="inline w-4 h-4 ml-0 mt-0.5" />
                          </>
                        )}
                      </td> */}
                      
                      {/* Lines up locations with other data horizontally */}
                      <td className="px-4 py-4 text-gray-900 font-bold text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{opp.location}</span>
                          {opp.remoteType === "Remote" && (
                            <img
                              src="/computer.svg"
                              alt="Remote"
                              className="w-4 h-4 object-contain mt-0.75"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-900 font-bold text-sm">
                        {opp.date}
                        {opp.recurrence != "Non-Recurring!" && (
                          <>
                            <span className="ml-0.5 text-xs font-bold text-blue-600"></span>
                            <img src="/recurrence.svg" alt="Recurring" className="inline w-6 h-4 ml-0 mb-0.5" />
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-900 ">
                        {opp.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-1 mb-1 ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          className="text-purple-700 cursor-pointer font-bold"
                          onClick={() => setModalOpp(opp)}
                        >
                          More Info
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <OpportunityModal
              open={Boolean(modalOpp)}
              opp={modalOpp}
              onClose={() => setModalOpp(null)}
              getTagColor={getTagColor}
            />

                        
            <LocationModal
              open={locationModalOpen}
              initialLabel={userLocationLabel}
              onResolved={({ coords, label }) => {
                setUserCoords(coords);
                setUserLocationLabel(label);
                // 👇 auto-sort nearest → farthest
                setSortKey("distance");
                setSortDirection("asc");
              }}
              onClose={() => setLocationModalOpen(false)}
            />


            

            {emailModalOpen && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                onClick={() => setEmailModalOpen(false)}
              >
                {/* <div
                  className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold mb-4">Email your Favorites</h2>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full border rounded-lg p-2 mb-4"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-lg border"
                      onClick={() => setEmailModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-red-700 text-white disabled:opacity-50"
                      onClick={sendEmail}
                      disabled={sending || !emailInput}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {statusMsg && <p className="mt-3 text-sm">{statusMsg}</p>}
                </div> */}


                <div
                  className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold mb-4 ">Email your Favorites</h2>
                  <input
                    autoFocus
                    type="email"
                    placeholder="you@example.com"
                    className="w-full border rounded-lg p-2 mb-4"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setEmailModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-900 disabled:opacity-80 cursor-pointer"
                      //onClick={sendEmail}
                      disabled={sending || !emailInput}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>              
              </div>
            )}
          </div>
        </div>
  );
}
