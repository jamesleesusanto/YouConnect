"use client";

import { useEffect, useState } from "react";
import app from "../../lib/firebase";
import '../../styles/global.css';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import FilterDropdown from '../../components/FilterDropdown';


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
    "default": "bg-gray-200 text-gray-800"
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




  // Fetch data from Firestore on mount
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "opportunities"));
      const data = querySnapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d["What is the name of your opportunity?"] || "",
          organization: d["Organization Name"] || "",
          location: d["City, State"] || "",
          ageGroup: d["What is the suggested age group?"] || "",
          opportunityType: d["Opportunity Type"] || "",
          tags: d["Industry Tags"]
            ? d["Industry Tags"].split(",").map(tag => tag.trim()).filter(Boolean)
            : [],
          description: d["Detailed description of the event"] || "",
          contact: d["E-mail Address"] || "",
        };
      });
      setOpportunities(data);
    };
    fetchData();
  }, []);

  // Filtered list
  const filteredOpportunities = opportunities.filter(opp =>
    (selectedIndustries.length === 0 || opp.tags.some(tag => selectedIndustries.includes(tag))) &&
    (selectedAgeGroups.length === 0 || selectedAgeGroups.includes(opp.ageGroup)) &&
    (selectedOpportunityTypes.length === 0 || selectedOpportunityTypes.includes(opp.opportunityType)) &&
    (
      opp.name.toLowerCase().includes(search.toLowerCase()) ||
      opp.organization.toLowerCase().includes(search.toLowerCase()) ||
      opp.location.toLowerCase().includes(search.toLowerCase())
    )
  );

  const opportunitiesToDisplay = showOnlyFavorites
    ? filteredOpportunities.filter(opp => favorites.includes(opp.id))
    : filteredOpportunities;

  // UI
  return (
    <div className="bg-purple-50 min-h-screen p-4 font-segoe">
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
            className={`bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition opacity-80 ${
              !showOnlyFavorites ? '' : 'opacity-100'
            }`}
            onClick={() => setShowOnlyFavorites(false)}
          >
            Show All Opportunities
          </button>
          <button
            className={`bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition opacity-80${
              showOnlyFavorites ? '' : 'opacity-100'
            }`}
            onClick={() => setShowOnlyFavorites(true)}
          >
            Favorites
          </button>
          <button
            className="bg-red-700 hover:bg-red-800 text-white text-sm font-bold h-9 py-1.75 px-4 rounded-full text-lg transition"
            onClick={exportFavoritesToCSV}
          >
            Export Favorites
          </button>
          {/*
          <label className="ml-6 text-lg flex items-center gap-2">
            Enable Distance Display
            <input type="checkbox" />
          </label>
          */}
        </div>



        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-700">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-white text-center">FAVORITE</th>
                <th className="px-4 py-3 text-xs font-bold text-white">OPPORTUNITY NAME</th>
                <th className="px-4 py-3 text-xs font-bold text-white">ORGANZATON</th>
                <th className="px-4 py-3 text-xs font-bold text-white">LOCATION</th>
                <th className="px-4 py-3 text-xs font-bold text-white">TAGS</th>
                <th className="px-4 py-3 text-xs font-bold text-white">MORE INFO</th>
              </tr>
            </thead>
            <tbody>
              {opportunitiesToDisplay.map(opp => (
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
                  <td className="px-4 py-4 text-gray-900 font-bold text-sm">{opp.organization}</td>
                  <td className="px-4 py-4 text-gray-900 font-bold text-sm">{opp.location}</td>
                  <td className="px-4 py-4 text-gray-900">
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
                      className="text-purple-700 font-bold"
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

       {/* Modal */}
        {modalOpp && (
          
           <div
              className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50"
              onClick={() => setModalOpp(null)}  // <--- clicking overlay closes modal
            >

               <div
                  className="bg-white rounded-xl shadow-xl p-10 max-w-2xl w-full relative text-gray-800"
                  onClick={e => e.stopPropagation()}  // <--- stops click inside modal from closing
                >
           

              <button
                className="absolute top-4 right-4 text-2xl text-purple-700 font-bold"
                onClick={() => setModalOpp(null)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className="text-3xl font-extrabold mb-2 text-purple-700">
                {modalOpp.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p><span className="font-bold text-purple-600">Organization:</span> {modalOpp.organization}</p>
                  <p><span className="font-bold text-purple-600">Location:</span> {modalOpp.location}</p>
                </div>
                <div>
                  <p><span className="font-bold text-purple-600">Age Group:</span> {modalOpp.ageGroup}</p>
                  <p>
                    <span className="font-bold text-purple-600">Industry:</span>
                    {modalOpp.tags.map((tag, i) => (
                      <span key={i} className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getTagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <p className="mb-2"><span className="font-bold text-purple-600">Description:</span> {modalOpp.description}</p>
              <p><span className="font-bold text-purple-600">Contact:</span> {modalOpp.contact}</p>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
