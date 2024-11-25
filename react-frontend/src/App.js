import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlay, FaPause, FaStop } from "react-icons/fa"; // FontAwesome icons for play/pause/stop
import "./App.css";

function App() {
  const [rows, setRows] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0); // Track the current progress of audio
  const [editedRow, setEditedRow] = useState(null); // Track the row being edited

  // Function to fetch rows
  const fetchRows = async () => {
    try {
      const response = await axios.get("http://localhost:8000/rows");
      setRows(response.data);
    } catch (error) {
      console.error("Ошибка при обработке строк:", error);
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
      alert("Строка успешно обновлена");
      setEditedRow(null); // Reset editing state
      fetchRows(); // Refresh rows after update
    } catch (error) {
      alert("Ошибка при обновлении базы. Обратитесь к админу");
      console.error("Ошибка при обновлении базы:", error);
    }
  };

  // Function to play/pause the audio
  const playPauseFile = (filePath) => {
    if (currentAudio && currentAudio.src === `http://localhost:8000/${filePath}`) {
      // If the audio is already playing, pause it
      if (currentAudio.paused) {
        currentAudio.play();
      } else {
        currentAudio.pause();
      }
    } else {
      // If a different audio is selected, stop the current one and play the new one
      if (currentAudio) {
        currentAudio.pause();
        setAudioProgress(0); // Reset progress to 0 when starting a new audio
      }

      const newAudio = new Audio(`http://localhost:8000/${filePath}`);
      newAudio.play();
      setCurrentAudio(newAudio);
      newAudio.ontimeupdate = () => {
        setAudioProgress((newAudio.currentTime / newAudio.duration) * 100);
      };

      // Handle when audio ends (optional - reset progress and state)
      newAudio.onended = () => {
        setAudioProgress(0);
      };
    }
  };

  // Stop the audio and reset progress
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setAudioProgress(0);
    }
  };
  // Handle seeking to a specific time in the audio
  const handleSeek = (event) => {
    if (currentAudio) {
      const newTime = (event.target.value / 100) * currentAudio.duration;
      currentAudio.currentTime = newTime;

      // Prevent seeking beyond the audio's duration
      if (currentAudio.currentTime >= currentAudio.duration) {
        currentAudio.pause();
        setAudioProgress(0);
      }
    }
  };

  return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1>Веб-форма</h1>

        {/* Legend for colors */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Ключи</h3>
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
                  {/* Display play/pause/stop buttons and seek timeline */}
                  <div>
                    <button onClick={() => playPauseFile(row.audio_file_path)}>
                      {currentAudio && currentAudio.src === `http://localhost:8000/${row.audio_file_path}` && !currentAudio.paused ? (
                          <FaPause/>
                      ) : (
                          <FaPlay/>
                      )}
                    </button>
                    {currentAudio && currentAudio.src === `http://localhost:8000/${row.audio_file_path}` && (
                        <>
                          <button onClick={stopAudio}>
                            <FaStop/>
                          </button>
                          <input
                              type="range"
                              value={audioProgress}
                              onChange={handleSeek}
                              max="100"
                              style={{width: "100%"}}
                          />
                        </>
                    )}
                  </div>
                </td>
                <td>
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.human_output}
                          onChange={(e) =>
                              setEditedRow({...editedRow, human_output: e.target.value})
                          }
                      />
                  ) : (
                      row.human_output
                  )}
                </td>
                <td>{row.model_output_v1}</td>
                <td>{row.date}</td>
                <td
                    style={{backgroundColor: "lightblue"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.cdng}
                          onChange={(e) => setEditedRow({...editedRow, cdng: e.target.value})}
                      />
                  ) : (
                      row.cdng
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightgreen"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.ngdu}
                          onChange={(e) => setEditedRow({...editedRow, ngdu: e.target.value})}
                      />
                  ) : (
                      row.ngdu
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightyellow"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.gu}
                          onChange={(e) => setEditedRow({...editedRow, gu: e.target.value})}
                      />
                  ) : (
                      row.gu
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightcoral"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.oiler_number}
                          onChange={(e) => setEditedRow({...editedRow, oiler_number: e.target.value})}
                      />
                  ) : (
                      row.oiler_number
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightpink"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.rut}
                          onChange={(e) => setEditedRow({...editedRow, rut: e.target.value})}
                      />
                  ) : (
                      row.rut
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightgrey"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.ip_address}
                          onChange={(e) => setEditedRow({...editedRow, ip_address: e.target.value})}
                      />
                  ) : (
                      row.ip_address
                  )}
                </td>
                <td
                    style={{backgroundColor: "lightgoldenrodyellow"}}
                >
                  {editedRow?.id === row.id ? (
                      <input
                          type="text"
                          value={editedRow.isu}
                          onChange={(e) => setEditedRow({...editedRow, isu: e.target.value})}
                      />
                  ) : (
                      row.isu
                  )}
                </td>
                <td>
                  {editedRow?.id === row.id ? (
                      <>
                        <button onClick={() => updateRow(editedRow)}>Сохранить</button>
                        <button onClick={() => setEditedRow(null)}>Отмена</button>
                      </>
                  ) : (
                      <button onClick={() => setEditedRow(row)}>Изменить</button>
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
