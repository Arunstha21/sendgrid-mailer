export const dummyIdPass = {
    type: "ID Pass" as const,
    idPass: {
      event: "PMCO Winter Split",
      stage: "Group Stage",
      matchNo: 3,
      map: "Erangel",
      matchId: 78945612,
      password: "winter2024",
      startTime: "8:00 PM",
      date: "15 Jan 2024",
      group: "Group A",
      groupings: [
        { slot: "1", team: "Nova Esports" },
        { slot: "2", team: "Cloud9" },
        { slot: "3", team: "Team SoloMid" },
        { slot: "4", team: "Faze Clan" },
        { slot: "5", team: "Team Liquid" }
      ]
    }
  }
  
  export const dummyGrouping = {
    type: "Groupings" as const,
    grouping: {
      event: "PMCO Spring Split",
      stage: "Qualifiers",
      group: "Group B",
      matches: [
        { map: "Erangel", date: "20 Jan 2024", startTime: "7:00 PM" },
        { map: "Miramar", date: "20 Jan 2024", startTime: "7:45 PM" },
        { map: "Sanhok", date: "20 Jan 2024", startTime: "8:30 PM" }
      ],
      groupings: [
        { slot: "1", team: "Virtus.pro" },
        { slot: "2", team: "Natus Vincere" },
        { slot: "3", team: "G2 Esports" },
        { slot: "4", team: "Team Secret" },
        { slot: "5", team: "Fnatic" }
      ]
    }
  }
  
  