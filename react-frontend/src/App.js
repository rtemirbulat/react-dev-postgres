import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [rows, setRows] = useState([]);
  const [editedRow, setEditedRow] = useState(null);

  // Function to fetch rows
  const fetchRows = async () => {
    try {
      const response = await axios.get("http://localhost:8000/rows");
      setRows(response.data);
    } catch (error) {
      console.error("Error fetching rows:", error);
    }
  };

  // Fetch rows and set up polling
  useEffect(() => {
    const interval = setInterval(fetchRows, 2000); // Poll the database every 2 seconds
    fetchRows(); // Initial fetch
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = () => {
      fetchRows(); // Fetch updated rows on WebSocket message
    };
    return () => ws.close(); // Cleanup WebSocket on component unmount
  }, [fetchRows]);

  // Update a row in the backend
  const updateRow = async (row) => {
    try {
      await axios.put(`http://localhost:8000/rows/${row.id}`, row);
      alert("Row updated successfully");
      setEditedRow(null); // Reset editing state
      fetchRows(); // Refresh rows after update
    } catch (error) {
      alert("Error updating row. Check console for details.");
      console.error("Error updating row:", error);
    }
  };

  // Play the media file
  const playFile = (filePath) => {
    const audio = new Audio(`http://localhost:8000/media/${filePath}`);
    audio.play();
  };

  return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Database Viewer</h1>

        {/* Legend for colors */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Legend</h3>
          <ul>
            <li><span style={{ backgroundColor: "lightblue", padding: "5px" }}></span>: ЦДНГ </li>
            <li><span style={{ backgroundColor: "lightgreen", padding: "5px" }}></span>: НГДУ</li>
            <li><span style={{ backgroundColor: "lightyellow", padding: "5px" }}></span>: ГУ</li>
            <li><span style={{ backgroundColor: "lightcoral", padding: "5px" }}></span>: Скважина</li>
            <li><span style={{ backgroundColor: "lightpink", padding: "5px" }}></span>: РУТ</li>
            <li><span style={{ backgroundColor: "lightgrey", padding: "5px" }}></span>: IP</li>
            <li><span style={{ backgroundColor: "lightgoldenrodyellow", padding: "5px" }}></span>: ИСУ</li>
          </ul>
        </div>

        <table border="1" cellPadding="10" style={{ width: "100%", textAlign: "left" }}>
          <thead>
          <tr>
            <th>Айди</th>
            <th>Аудио</th>
            <th>Корректировка</th>
            <th>Вывод модели</th>
            <th>Дата</th>
            <th>ЦДНГ</th>
            <th>НГДУ</th>
            <th>ГУ</th>
            <th>Скважина</th>
            <th>РУТ</th>
            <th>IP-адрес</th>
            <th>ИСУ</th>
            <th>Действия</th>
          </tr>
          </thead>
          <tbody>
          {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                  <button onClick={() => playFile(row.audio_file_path)}>Play</button>
                </td>
                <td>
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.human_output}
                          onChange={(e) =>
                              setEditedRow({ ...editedRow, human_output: e.target.value })
                          }
                      />
                  ) : (
                      row.human_output
                  )}
                </td>
                <td>{row.model_output_v1}</td>
                <td>{row.date}</td>
                <td
                    style={{ backgroundColor: "lightblue" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.cdng}
                          onChange={(e) => setEditedRow({ ...editedRow, cdng: e.target.value })}
                      />
                  ) : (
                      row.cdng
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightgreen" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.ngdu}
                          onChange={(e) => setEditedRow({ ...editedRow, ngdu: e.target.value })}
                      />
                  ) : (
                      row.ngdu
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightyellow" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.gu}
                          onChange={(e) => setEditedRow({ ...editedRow, gu: e.target.value })}
                      />
                  ) : (
                      row.gu
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightcoral" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.oiler_number}
                          onChange={(e) => setEditedRow({ ...editedRow, oiler_number: e.target.value })}
                      />
                  ) : (
                      row.oiler_number
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightpink" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.rut}
                          onChange={(e) => setEditedRow({ ...editedRow, rut: e.target.value })}
                      />
                  ) : (
                      row.rut
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightgrey" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.ip_address}
                          onChange={(e) => setEditedRow({ ...editedRow, ip_address: e.target.value })}
                      />
                  ) : (
                      row.ip_address
                  )}
                </td>
                <td
                    style={{ backgroundColor: "lightgoldenrodyellow" }}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.isu}
                          onChange={(e) => setEditedRow({ ...editedRow, isu: e.target.value })}
                      />
                  ) : (
                      row.isu
                  )}
                </td>
                <td>
                  {editedRow?.id === row.id ? (
                      <>
                        <button onClick={() => updateRow(editedRow)}>Save</button>
                        <button onClick={() => setEditedRow(null)}>Cancel</button>
                      </>
                  ) : (
                      <button onClick={() => setEditedRow(row)}>Edit</button>
                  )}
                </td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
}

export default App;