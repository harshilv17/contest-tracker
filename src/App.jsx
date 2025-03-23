import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import moment from 'moment'; // For date formatting and calculations
import './App.css';

// Contest Context for Bookmarks and Theme
const ContestContext = createContext();

function ContestProvider({ children }) {
    const [bookmarks, setBookmarks] = useState(() => {
        const storedBookmarks = localStorage.getItem('bookmarks');
        return storedBookmarks ? JSON.parse(storedBookmarks) : [];
    });
    const [darkMode, setDarkMode] = useState(() => {
        const storedMode = localStorage.getItem('darkMode');
        return storedMode === 'true' ? true : false;
    });

    useEffect(() => {
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }, [bookmarks]);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.body.classList.toggle('dark-mode', darkMode); // Apply dark mode to the body
    }, [darkMode]);

    const toggleBookmark = (contestName) => {
        if (bookmarks.includes(contestName)) {
            setBookmarks(bookmarks.filter(name => name !== contestName));
        } else {
            setBookmarks([...bookmarks, contestName]);
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(prevMode => !prevMode);
    };

    return (
        <ContestContext.Provider value={{ bookmarks, toggleBookmark, darkMode, toggleDarkMode }}>
            {children}
        </ContestContext.Provider>
    );
}

// Contest Item Component
function ContestItem({ contest }) {
    const { bookmarks, toggleBookmark } = useContext(ContestContext);
    const isBookmarked = bookmarks.includes(contest.name);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            const startTime = moment.unix(contest.start_time);
            const now = moment();

            if (startTime.isAfter(now)) {
                const duration = moment.duration(startTime.diff(now));
                const days = duration.days();
                const hours = duration.hours();
                const minutes = duration.minutes();
                const seconds = duration.seconds();

                setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining('Contest started!');
                clearInterval(intervalId); // Stop updating
            }
        }, 1000);

        return () => clearInterval(intervalId); // Cleanup
    }, [contest.start_time]);

    const handleBookmarkClick = () => {
        toggleBookmark(contest.name);
    };

    return (
        <div className="contest-item">
            <h3>{contest.name}</h3>
            <p>Platform: {contest.platform}</p>
            <p>Start Date: {moment.unix(contest.start_time).format('MMMM Do YYYY, h:mm A')}</p>
            {contest.phase === 'BEFORE' && <p>Time Remaining: {timeRemaining}</p>}
            <a href={contest.link} target="_blank" rel="noopener noreferrer">
                Contest Link
            </a>
            <button className={isBookmarked ? 'bookmark-button bookmarked' : 'bookmark-button'} onClick={handleBookmarkClick}>
                {isBookmarked ? 'Unbookmark' : 'Bookmark'}
            </button>
            <p>Phase: {contest.phase}</p>
        </div>
    );
}

// Contest List Component
function ContestList({ contests }) {
    if (!contests || contests.length === 0) {
        return <p>No contests found.</p>;
    }

    return (
        <div className="contest-list">
            {contests.map(contest => (
                <ContestItem key={contest.name} contest={contest} />
            ))}
        </div>
    );
}

// Filter Component
function Filter({ onFilterChange }) {
    const handleCheckboxChange = (event) => {
        const platform = event.target.value;
        const isChecked = event.target.checked;
        onFilterChange(platform, isChecked);
    };

    return (
        <div className="filter">
            <label>
                <input
                    type="checkbox"
                    value="codeforces"
                    onChange={handleCheckboxChange}
                />
                Codeforces
            </label>
            <label>
                <input
                    type="checkbox"
                    value="codechef"
                    onChange={handleCheckboxChange}
                />
                CodeChef
            </label>
            <label>
                <input
                    type="checkbox"
                    value="leetcode"
                    onChange={handleCheckboxChange}
                />
                LeetCode
            </label>
        </div>
    );
}

// Theme Toggle Component
function ThemeToggle() {
    const { darkMode, toggleDarkMode } = useContext(ContestContext);

    return (
        <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
    );
}

// Main App Component
function App() {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);

    useEffect(() => {
        const fetchContests = async () => {
            setLoading(true);
            setError(null); // Clear previous errors
            try {
                // Mock API call (replace with your actual API endpoint)
                const response = await axios.get('/api/contests.json'); // Assuming data is in public/api/contests.json

                // Apply platform filtering on the frontend
                let filteredContests = response.data;
                if (selectedPlatforms.length > 0) {
                    filteredContests = filteredContests.filter(contest =>
                        selectedPlatforms.includes(contest.platform)
                    );
                }

                // Sort contests by start time
                filteredContests.sort((a, b) => a.start_time - b.start_time);

                setContests(filteredContests);

            } catch (err) {
                console.error("Error fetching contests:", err);
                setError('Failed to load contests. Please check the console for details.');
            } finally {
                setLoading(false);
            }
        };

        fetchContests();
    }, [selectedPlatforms]);

    const handleFilterChange = (platform, isChecked) => {
        if (isChecked) {
            setSelectedPlatforms(prev => [...prev, platform]);
        } else {
            setSelectedPlatforms(prev => prev.filter(p => p !== platform));
        }
    };

    if (loading) {
        return <div className="loading">Loading contests...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="app-container">
            <ThemeToggle />
            <h1>Coding Contest Tracker</h1>
            <Filter onFilterChange={handleFilterChange} />
            <ContestList contests={contests} />
        </div>
    );
}

function AppWrapper() {
    return (
        <ContestProvider>
            <App />
        </ContestProvider>
    );
}

export default AppWrapper;
// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
