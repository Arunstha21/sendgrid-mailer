import React from 'react'

type Groupings = {
  slot: string
  team: string
}

type Matches = {
  map: string
  date: string
  startTime: string
}

export type IDPass = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  matchNo: number
  map: string
  matchId: number
  password: string
  startTime: string
  date: string
  group: string
  groupName: string
  groupings: Groupings[]
}

export type Grouping = {
  event: string
  discordLink: string
  organizer: string
  stage: string
  group: string
  groupName: string
  matches: Matches[]
  groupings: Groupings[]
}

type Props = {
  type: "ID Pass" | "Groupings"
  data: IDPass | Grouping | null
}

export default function EventMessage({ type, data }: Props) {
  if (!data) {
    return <p>No data available</p>;
  }
  
  const tableStyle = {
    borderCollapse: 'collapse',
    width: '80%',
    maxWidth: '400px',
    margin: '0 auto',
    fontSize: '14px',
  } as React.CSSProperties

  const cellStyle = {
    border: '1px solid #ddd',
    textAlign: 'center',
  } as React.CSSProperties

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  } as React.CSSProperties

  if (type === "ID Pass") {
    const idPass = data as IDPass
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <span contentEditable="true" suppressContentEditableWarning>
          <p>Hi Team,</p>
          <p>Please find below the details for <strong>Match {idPass.matchNo}</strong> of <strong>{idPass.event}</strong> of {idPass.stage}</p>
        </span>
        <span>
          <p><strong>🕒 Match Start Time: </strong>{idPass.startTime}<br/>
          <strong>🗺️ Map: </strong>{idPass.map}<br/>
          <strong>📌 Room ID: </strong>{idPass.matchId}<br/>
          <strong>🔒 Room Password: </strong>{idPass.password}</p>
        </span>
        <h3>Slot List of {idPass.groupName}:-</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Slot</th>
              <th style={headerCellStyle}>Team Name</th>
            </tr>
          </thead>
          <tbody>
            {idPass.groupings.map((group, index) => (
              <tr key={index}>
                <td style={cellStyle}>{group.slot}</td>
                <td style={cellStyle}>{group.team}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <br/>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>{`Teams must join only the respective slots assigned to them under `}<strong>{idPass.groupName}</strong></p>
        <p>Join our discord server if you need any help or have any queries.
        <br/>Link: {idPass.discordLink}</p>
        <p>⚠️ Kindly ensure that no player with an unregistered in-game name (IGN) participates in the match. Any team found violating this rule will have the unregistered player removed immediately.</p>
        <p>We appreciate your cooperation and look forward to a smooth match experience.
        </p>
        <p>Good luck!</p>
        <p><strong>Yours truly,</strong><br/>{idPass.organizer}</p>
        </span>
      </div>
    )
  }

  if (type === "Groupings") {
    const grouping = data as Grouping
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Hi Team,</p>
        <p>This is a reminder for your upcoming <strong>{grouping.event} - {grouping.stage}</strong> matches. Please find the match details below:</p>
        <h3>Schedule:-</h3>
        </span>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>S.N</th>
              <th style={headerCellStyle}>Map</th>
              <th style={headerCellStyle}>Date</th>
              <th style={headerCellStyle}>Time</th>
            </tr>
          </thead>
          <tbody>
            {grouping.matches?.map((match, index) => (
              <tr key={index}>
                <td style={cellStyle}>{index + 1}</td>
                <td style={cellStyle}>{match.map}</td>
                <td style={cellStyle}>{match.date}</td>
                <td style={cellStyle}>{match.startTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <span contentEditable="true" suppressContentEditableWarning>
        <p>Join our discord server to view schedules, updates, and coordinate with the operations team:<br/>
        Link: {grouping.discordLink}</p>
        </span>
        <h3>Groupings of {grouping.groupName}:-</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Slot</th>
              <th style={headerCellStyle}>Team Name</th>
            </tr>
          </thead>
          <tbody>
            {grouping.groupings.map((group, index) => (
              <tr key={index}>
                <td style={cellStyle}>{group.slot}</td>
                <td style={cellStyle}>{group.team}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <span contentEditable="true" suppressContentEditableWarning>
          <p>Room ID & Password will be sent to the Owner, Player 1, and Manager email addresses 15 minutes before the scheduled match time.</p>
          <p>Please ensure your team is ready on time. For any issues, feel free to reach out.</p>
          <p><strong>Yours truly,</strong><br />{grouping.organizer}</p>
        </span>
      </div>
    )
  }

  return null
}

