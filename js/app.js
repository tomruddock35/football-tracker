const STORAGE = {
    PLAYERS: "footballTrackerPlayers",
    MATCHES: "footballTrackerMatches",
    CURRENT_MATCH: "footballTrackerCurrentMatch"
};


const state = {

    setup: {
        matchdaySquad: [],
        startingFive: [],
        goalkeeper: null,
        captain: null
    },

    timer: {
        interval: null,
        running: false
    },

    goalScorer: null,

    substitutionOff: null,

    substitutionOn: null
};


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}


function generateId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 8)
    );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatTime(totalSeconds) {

    totalSeconds =
        Math.max(
            0,
            Math.floor(totalSeconds || 0)
        );

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );
}


function todayString() {

    const date = new Date();

    return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
    );
}


function getPlayerName(playerId) {

    const player =
        getPlayers().find(function (item) {
            return item.id === playerId;
        });

    return player
        ? player.name
        : "Unknown player";
}


/* =========================================================
   STORAGE
   ========================================================= */

function getPlayers() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    STORAGE.PLAYERS
                )
            ) || []
        );

    } catch (error) {

        return [];

    }
}


function savePlayers(players) {

    localStorage.setItem(
        STORAGE.PLAYERS,
        JSON.stringify(players)
    );
}


function getMatches() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    STORAGE.MATCHES
                )
            ) || []
        );

    } catch (error) {

        return [];

    }
}


function saveMatches(matches) {

    localStorage.setItem(
        STORAGE.MATCHES,
        JSON.stringify(matches)
    );
}


function getCurrentMatch() {

    try {

        return JSON.parse(
            localStorage.getItem(
                STORAGE.CURRENT_MATCH
            )
        );

    } catch (error) {

        return null;

    }
}


function saveCurrentMatch(match) {

    localStorage.setItem(
        STORAGE.CURRENT_MATCH,
        JSON.stringify(match)
    );
}


function clearCurrentMatch() {

    localStorage.removeItem(
        STORAGE.CURRENT_MATCH
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showScreen(screenId) {

    document
        .querySelectorAll(".screen")
        .forEach(function (screen) {

            screen.classList.remove("active");

        });


    const screen = $(screenId);

    if (screen) {
        screen.classList.add("active");
    }


    document
        .querySelectorAll(".nav-button")
        .forEach(function (button) {

            button.classList.toggle(
                "active",
                button.dataset.screen === screenId
            );

        });


    window.scrollTo(0, 0);


    if (screenId === "homeScreen") {
        renderHome();
    }


    if (screenId === "squadScreen") {
        renderPlayers();
    }


    if (screenId === "newMatchScreen") {
        renderMatchSetup();
    }


    if (screenId === "historyScreen") {
        renderHistory();
    }


    if (screenId === "liveScreen") {
        renderLiveMatch();
    }
}


function handleNavigation(screenId) {

    const currentMatch =
        getCurrentMatch();


    if (
        currentMatch &&
        !currentMatch.finished &&
        screenId !== "liveScreen"
    ) {

        const leaveMatch =
            confirm(
                "A match is currently in progress. Leave the live match screen?"
            );


        if (!leaveMatch) {
            return;
        }

    }


    showScreen(screenId);
}


function setupNavigation() {

    document
        .querySelectorAll(".nav-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    handleNavigation(
                        button.dataset.screen
                    );

                }
            );

        });
}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

    const matches =
        getMatches();


    let goalCount = 0;
    let assistCount = 0;


    matches.forEach(function (match) {

        (match.events || []).forEach(function (event) {

            if (event.type === "goal") {

                goalCount += 1;

                if (event.assist) {
                    assistCount += 1;
                }

            }

        });

    });


    $("homeMatchCount").textContent =
        matches.length;

    $("homeGoalCount").textContent =
        goalCount;

    $("homeAssistCount").textContent =
        assistCount;


    const recent =
        matches.slice(0, 5);


    if (recent.length === 0) {

        $("homeRecentMatches").innerHTML =
            '<div class="history-empty">No matches played yet.</div>';

        return;
    }


    $("homeRecentMatches").innerHTML =
        recent.map(function (match) {

            return `
                <div class="recent-match">

                    <div>
                        <div class="recent-match-name">
                            vs ${escapeHtml(match.opponent)}
                        </div>

                        <div class="recent-match-date">
                            ${escapeHtml(match.date)}
                        </div>
                    </div>

                    <div class="recent-match-score">
                        ${match.score.us} - ${match.score.them}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   SQUAD
   ========================================================= */

function addPlayer() {

    const input =
        $("playerName");

    const name =
        input.value.trim();


    if (!name) {

        alert(
            "Please enter a player name."
        );

        input.focus();

        return;
    }


    const players =
        getPlayers();


    const duplicate =
        players.some(function (player) {

            return (
                player.name.toLowerCase() ===
                name.toLowerCase()
            );

        });


    if (duplicate) {

        alert(
            "That player already exists."
        );

        return;
    }


    players.push({
        id: generateId(),
        name: name
    });


    savePlayers(players);


    input.value = "";


    renderPlayers();

    renderMatchSetup();
}


function deletePlayer(playerId) {

    const playerName =
        getPlayerName(playerId);


    if (
        !confirm(
            "Delete " +
            playerName +
            " from the squad?"
        )
    ) {
        return;
    }


    const players =
        getPlayers().filter(function (player) {

            return player.id !== playerId;

        });


    savePlayers(players);


    renderPlayers();

    renderMatchSetup();
}


function renderPlayers() {

    const players =
        getPlayers();


    $("playerCount").textContent =
        players.length;


    if (players.length === 0) {

        $("playerList").innerHTML =
            '<div class="history-empty">No players added yet.</div>';

        return;
    }


    $("playerList").innerHTML =
        players.map(function (player) {

            return `
                <div class="player-row">

                    <span class="player-name">
                        ${escapeHtml(player.name)}
                    </span>

                    <button
                        type="button"
                        class="delete-player-button"
                        data-delete-player="${player.id}"
                        aria-label="Delete ${escapeHtml(player.name)}"
                    >
                        ×
                    </button>

                </div>
            `;

        }).join("");


    document
        .querySelectorAll("[data-delete-player]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    deletePlayer(
                        button.dataset.deletePlayer
                    );

                }
            );

        });
}


/* =========================================================
   MATCH SETUP
   ========================================================= */

function resetMatchSetup() {

    state.setup = {
        matchdaySquad: [],
        startingFive: [],
        goalkeeper: null,
        captain: null
    };

    renderMatchSetup();
}


function toggleMatchdayPlayer(playerId) {

    const index =
        state.setup.matchdaySquad.indexOf(
            playerId
        );


    if (index >= 0) {

        state.setup.matchdaySquad.splice(
            index,
            1
        );


        state.setup.startingFive =
            state.setup.startingFive.filter(
                function (id) {
                    return id !== playerId;
                }
            );


        if (
            state.setup.goalkeeper ===
            playerId
        ) {
            state.setup.goalkeeper = null;
        }


        if (
            state.setup.captain ===
            playerId
        ) {
            state.setup.captain = null;
        }

    } else {

        state.setup.matchdaySquad.push(
            playerId
        );

    }


    renderMatchSetup();
}


function toggleStartingPlayer(playerId) {

    if (
        !state.setup.matchdaySquad.includes(
            playerId
        )
    ) {
        return;
    }


    const index =
        state.setup.startingFive.indexOf(
            playerId
        );


    if (index >= 0) {

        state.setup.startingFive.splice(
            index,
            1
        );

    } else {

        if (
            state.setup.startingFive.length >= 5
        ) {

            alert(
                "You can only select five starting players."
            );

            return;
        }


        state.setup.startingFive.push(
            playerId
        );

    }


    renderMatchSetup();
}


function selectGoalkeeper(playerId) {

    if (
        !state.setup.matchdaySquad.includes(
            playerId
        )
    ) {
        return;
    }


    if (
        state.setup.goalkeeper ===
        playerId
    ) {

        state.setup.goalkeeper = null;

    } else {

        state.setup.goalkeeper = playerId;

    }


    renderMatchSetup();
}


function selectCaptain(playerId) {

    if (
        !state.setup.matchdaySquad.includes(
            playerId
        )
    ) {
        return;
    }


    if (
        state.setup.captain ===
        playerId
    ) {

        state.setup.captain = null;

    } else {

        state.setup.captain = playerId;

    }


    renderMatchSetup();
}


function createSetupButton(
    player,
    options
) {

    const selected =
        options.selected
            ? " selected"
            : "";


    const goalkeeperIcon =
        options.showGoalkeeper
            ? `
                <span
                    class="selection-icon"
                >
                    ${
                        options.isGoalkeeper
                            ? "🧤"
                            : "🥅"
                    }
                </span>
            `
            : "";


    const captainIcon =
        options.showCaptain
            ? `
                <span
                    class="selection-icon"
                >
                    ${
                        options.isCaptain
                            ? "©️"
                            : "⚪"
                    }
                </span>
            `
            : "";


    return `
        <button
            type="button"
            class="selection-button${selected}"
            data-player-id="${player.id}"
        >

            <span class="player-button-name">
                ${escapeHtml(player.name)}
            </span>

            ${goalkeeperIcon}
            ${captainIcon}

        </button>
    `;
}


function renderMatchSetup() {

    const players =
        getPlayers();


    $("squadSelectionCount").textContent =
        state.setup.matchdaySquad.length;


    $("startingSelectionCount").textContent =
        state.setup.startingFive.length +
        " / 5";


    /* Matchday squad */

    if (players.length === 0) {

        $("squadSelection").innerHTML =
            '<div class="history-empty">Add players on the Squad screen first.</div>';

    } else {

        $("squadSelection").innerHTML =
            players.map(function (player) {

                return createSetupButton(
                    player,
                    {
                        selected:
                            state.setup.matchdaySquad.includes(
                                player.id
                            )
                    }
                );

            }).join("");

    }


    /* Starting five */

    const squadPlayers =
        players.filter(function (player) {

            return state.setup.matchdaySquad.includes(
                player.id
            );

        });


    if (squadPlayers.length === 0) {

        $("startingSelection").innerHTML =
            '<div class="history-empty">Select your matchday squad first.</div>';

    } else {

        $("startingSelection").innerHTML =
            squadPlayers.map(function (player) {

                return createSetupButton(
                    player,
                    {
                        selected:
                            state.setup.startingFive.includes(
                                player.id
                            )
                    }
                );

            }).join("");

    }


    /* Goalkeeper */

    if (squadPlayers.length === 0) {

        $("goalkeeperSelection").innerHTML =
            '<div class="history-empty">Select your matchday squad first.</div>';

    } else {

        $("goalkeeperSelection").innerHTML =
            squadPlayers.map(function (player) {

                return createSetupButton(
                    player,
                    {
                        showGoalkeeper: true,

                        isGoalkeeper:
                            state.setup.goalkeeper ===
                            player.id
                    }
                );

            }).join("");

    }


    /* Captain */

    if (squadPlayers.length === 0) {

        $("captainSelection").innerHTML =
            '<div class="history-empty">Select your matchday squad first.</div>';

    } else {

        $("captainSelection").innerHTML =
            squadPlayers.map(function (player) {

                return createSetupButton(
                    player,
                    {
                        showCaptain: true,

                        isCaptain:
                            state.setup.captain ===
                            player.id
                    }
                );

            }).join("");

    }


    document
        .querySelectorAll(
            "#squadSelection .selection-button"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    toggleMatchdayPlayer(
                        button.dataset.playerId
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "#startingSelection .selection-button"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    toggleStartingPlayer(
                        button.dataset.playerId
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "#goalkeeperSelection .selection-button"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectGoalkeeper(
                        button.dataset.playerId
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "#captainSelection .selection-button"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectCaptain(
                        button.dataset.playerId
                    );

                }
            );

        });
}


/* =========================================================
   START MATCH
   ========================================================= */

function startMatch() {

    const opponent =
        $("opponent").value.trim();


    const matchDate =
        $("matchDate").value ||
        todayString();


    if (!opponent) {

        alert(
            "Please enter the opponent."
        );

        $("opponent").focus();

        return;
    }


    if (
        state.setup.matchdaySquad.length === 0
    ) {

        alert(
            "Please select your matchday squad."
        );

        return;
    }


    if (
        state.setup.startingFive.length !== 5
    ) {

        alert(
            "Please select exactly five starting players."
        );

        return;
    }


    if (!state.setup.goalkeeper) {

        alert(
            "Please select the goalkeeper."
        );

        return;
    }


    if (!state.setup.captain) {

        alert(
            "Please select the captain."
        );

        return;
    }


    if (
        !state.setup.startingFive.includes(
            state.setup.goalkeeper
        )
    ) {

        alert(
            "The goalkeeper must be one of the starting five."
        );

        return;
    }


    const match = {

        id: generateId(),

        opponent: opponent,

        date: matchDate,

        score: {
            us: 0,
            them: 0
        },

        half: 1,

        elapsedSeconds: 0,

        running: true,

        finished: false,

        matchdaySquad:
            [...state.setup.matchdaySquad],

        startingFive:
            [...state.setup.startingFive],

        goalkeeper:
            state.setup.goalkeeper,

        currentGoalkeeperId:
            state.setup.goalkeeper,

        captain:
            state.setup.captain,

        events: [],

        playerTimes: {}

    };


    match.matchdaySquad.forEach(
        function (playerId) {

            match.playerTimes[playerId] = {

                intervals: [],

                activeStart: null,

                activeRole: null

            };

        }
    );


    match.startingFive.forEach(
        function (playerId) {

            match.playerTimes[playerId]
                .activeStart = 0;


            match.playerTimes[playerId]
                .activeRole =
                playerId ===
                match.goalkeeper
                    ? "goalkeeper"
                    : "outfield";

        }
    );


    saveCurrentMatch(match);


    startTimer();


    renderLiveMatch();

    showScreen("liveScreen");
}


/* =========================================================
   TIMER
   ========================================================= */

function startTimer() {

    stopTimer();


    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    match.running = true;

    saveCurrentMatch(match);


    state.timer.running = true;


    state.timer.interval =
        setInterval(
            function () {

                const currentMatch =
                    getCurrentMatch();


                if (
                    !currentMatch ||
                    currentMatch.finished ||
                    !currentMatch.running
                ) {
                    return;
                }


                currentMatch.elapsedSeconds += 1;


                saveCurrentMatch(
                    currentMatch
                );


                updateTimerDisplay();

                renderLiveStats();

            },
            1000
        );


    updateTimerDisplay();
}


function stopTimer() {

    if (state.timer.interval) {

        clearInterval(
            state.timer.interval
        );

        state.timer.interval = null;
    }


    state.timer.running = false;
}


function togglePause() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    if (match.running) {

        match.running = false;

        stopTimer();

        $("pauseBtn").textContent =
            "Resume";

    } else {

        match.running = true;

        saveCurrentMatch(match);

        startTimer();

        $("pauseBtn").textContent =
            "Pause";

        return;
    }


    saveCurrentMatch(match);

    renderLiveStats();
}


function updateTimerDisplay() {

    const match =
        getCurrentMatch();


    if (!match) {

        $("timer").textContent =
            "00:00";

        return;
    }


    $("timer").textContent =
        formatTime(
            match.elapsedSeconds
        );
}


/* =========================================================
   HALF TIME
   ========================================================= */

function recordHalfTime() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    if (match.half !== 1) {

        alert(
            "Half time has already been recorded."
        );

        return;
    }


    match.running = false;

    stopTimer();

    match.half = 2;


    match.events.push({

        id: generateId(),

        type: "halfTime",

        elapsedSeconds:
            match.elapsedSeconds

    });


    saveCurrentMatch(match);


    $("pauseBtn").textContent =
        "Resume";


    renderLiveMatch();


    alert(
        "Half time recorded."
    );
}


/* =========================================================
   GOALS
   ========================================================= */

function openGoalPanel() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    if (!match.running) {

        alert(
            "Resume the match before recording a goal."
        );

        return;
    }


    state.goalScorer = null;


    $("goalPanel")
        .classList
        .remove("hidden");


    $("assistSection")
        .classList
        .add("hidden");


    renderGoalScorerButtons();


    $("goalPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeGoalPanel() {

    state.goalScorer = null;


    $("goalPanel")
        .classList
        .add("hidden");


    $("assistSection")
        .classList
        .add("hidden");
}


function renderGoalScorerButtons() {

    const match =
        getCurrentMatch();


    if (!match) {
        return;
    }


    $("goalScorerButtons").innerHTML =
        match.matchdaySquad
            .map(function (playerId) {

                const selected =
                    state.goalScorer ===
                    playerId;


                return `
                    <button
                        type="button"
                        class="selection-button${
                            selected
                                ? " highlighted"
                                : ""
                        }"
                        data-goal-scorer="${playerId}"
                    >

                        <span class="player-button-name">
                            ${escapeHtml(
                                getPlayerName(
                                    playerId
                                )
                            )}
                        </span>

                        ${
                            selected
                                ? '<span class="selection-icon">✓</span>'
                                : ""
                        }

                    </button>
                `;

            })
            .join("");


    document
        .querySelectorAll(
            "[data-goal-scorer]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectGoalScorer(
                        button.dataset.goalScorer
                    );

                }
            );

        });
}


function selectGoalScorer(playerId) {

    state.goalScorer =
        playerId;


    $("selectedScorerName")
        .textContent =
        getPlayerName(playerId);


    $("assistSection")
        .classList
        .remove("hidden");


    renderGoalScorerButtons();

    renderAssistButtons();
}


function renderAssistButtons() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        !state.goalScorer
    ) {
        return;
    }


    const players =
        match.matchdaySquad.filter(
            function (playerId) {

                return (
                    playerId !==
                    state.goalScorer
                );

            }
        );


    $("assistButtons").innerHTML = `

        <button
            type="button"
            class="selection-button"
            data-assist="none"
        >

            <span class="player-button-name">
                No Assist
            </span>

        </button>


        ${
            players.map(
                function (playerId) {

                    return `
                        <button
                            type="button"
                            class="selection-button"
                            data-assist="${playerId}"
                        >

                            <span class="player-button-name">
                                ${escapeHtml(
                                    getPlayerName(
                                        playerId
                                    )
                                )}
                            </span>

                        </button>
                    `;

                }
            ).join("")
        }

    `;


    document
        .querySelectorAll(
            "[data-assist]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const assistId =
                        button.dataset.assist ===
                        "none"
                            ? null
                            : button.dataset.assist;


                    recordGoal(
                        state.goalScorer,
                        assistId
                    );

                }
            );

        });
}


function recordGoal(
    goalScorerId,
    assistId
) {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished ||
        !goalScorerId
    ) {
        return;
    }


    match.score.us += 1;


    match.events.push({

        id: generateId(),

        type: "goal",

        elapsedSeconds:
            match.elapsedSeconds,

        scorer:
            goalScorerId,

        assist:
            assistId || null

    });


    saveCurrentMatch(match);


    closeGoalPanel();

    renderLiveMatch();
}


/* =========================================================
   SUBSTITUTIONS
   ========================================================= */

function getPlayersCurrentlyOnPitch(match) {

    return match.matchdaySquad.filter(
        function (playerId) {

            const time =
                match.playerTimes[playerId];


            return (
                time &&
                time.activeStart !== null
            );

        }
    );
}


function getPlayersCurrentlyOffPitch(match) {

    return match.matchdaySquad.filter(
        function (playerId) {

            const time =
                match.playerTimes[playerId];


            return (
                !time ||
                time.activeStart === null
            );

        }
    );
}


function openSubstitutionPanel() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    /*
     * Substitutions are allowed while the clock is paused.
     * This is required for half-time substitutions, and also
     * allows normal substitutions during a stoppage.
     */


    state.substitutionOff = null;

    state.substitutionOn = null;


    $("substitutionPanel")
        .classList
        .remove("hidden");


    $("substitutionOnStep")
        .classList
        .add("hidden");


    $("substitutionRoleStep")
        .classList
        .add("hidden");


    renderSubstitutionOffButtons();


    $("substitutionPanel").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeSubstitutionPanel() {

    state.substitutionOff = null;

    state.substitutionOn = null;


    $("substitutionPanel")
        .classList
        .add("hidden");


    $("substitutionOnStep")
        .classList
        .add("hidden");


    $("substitutionRoleStep")
        .classList
        .add("hidden");
}


function renderSubstitutionOffButtons() {

    const match =
        getCurrentMatch();


    if (!match) {
        return;
    }


    const playersOnPitch =
        getPlayersCurrentlyOnPitch(
            match
        );


    $("substitutionOffButtons").innerHTML =
        playersOnPitch
            .map(function (playerId) {

                const time =
                    match.playerTimes[playerId];


                const role =
                    time.activeRole ===
                    "goalkeeper"
                        ? " 🧤"
                        : "";


                return `
                    <button
                        type="button"
                        class="selection-button"
                        data-sub-off="${playerId}"
                    >

                        <span class="player-button-name">
                            ${escapeHtml(
                                getPlayerName(
                                    playerId
                                )
                            )}${role}
                        </span>

                    </button>
                `;

            })
            .join("");


    if (
        playersOnPitch.length === 0
    ) {

        $("substitutionOffButtons").innerHTML =
            '<div class="history-empty">No players are currently on the pitch.</div>';

        return;
    }


    document
        .querySelectorAll(
            "[data-sub-off]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectSubstitutionOff(
                        button.dataset.subOff
                    );

                }
            );

        });
}


function selectSubstitutionOff(playerId) {

    const match =
        getCurrentMatch();


    if (!match) {
        return;
    }


    state.substitutionOff =
        playerId;


    state.substitutionOn =
        null;


    $("selectedPlayerOff")
        .textContent =
        getPlayerName(playerId);


    $("substitutionOnStep")
        .classList
        .remove("hidden");


    $("substitutionRoleStep")
        .classList
        .add("hidden");


    renderSubstitutionOnButtons();
}


function renderSubstitutionOnButtons() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        !state.substitutionOff
    ) {
        return;
    }


    const playersOff =
        getPlayersCurrentlyOffPitch(
            match
        );


    const availablePlayers =
        playersOff.filter(
            function (playerId) {

                return (
                    playerId !==
                    state.substitutionOff
                );

            }
        );


    $("substitutionOnButtons").innerHTML =
        availablePlayers
            .map(function (playerId) {

                return `
                    <button
                        type="button"
                        class="selection-button"
                        data-sub-on="${playerId}"
                    >

                        <span class="player-button-name">
                            ${escapeHtml(
                                getPlayerName(
                                    playerId
                                )
                            )}
                        </span>

                    </button>
                `;

            })
            .join("");


    if (
        availablePlayers.length === 0
    ) {

        $("substitutionOnButtons").innerHTML =
            '<div class="history-empty">No available players on the bench.</div>';

        return;
    }


    document
        .querySelectorAll(
            "[data-sub-on]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectSubstitutionOn(
                        button.dataset.subOn
                    );

                }
            );

        });
}


function selectSubstitutionOn(playerId) {

    const match =
        getCurrentMatch();

    if (!match || !state.substitutionOff) {
        return;
    }

    state.substitutionOn =
        playerId;

    /*
     * Default to the outgoing player's role. The user can
     * change this before confirming the substitution.
     */
    const outgoingRole =
        match.playerTimes[state.substitutionOff]?.activeRole ||
        "outfield";

    $("substitutionRoleStep")
        .classList
        .remove("hidden");

    /*
     * Highlight the sensible default. The actual role is
     * supplied when one of the two role buttons is pressed.
     */
    $("substitutionOutfieldBtn")
        .classList
        .toggle(
            "highlighted",
            outgoingRole === "outfield"
        );

    $("substitutionGoalkeeperBtn")
        .classList
        .toggle(
            "highlighted",
            outgoingRole === "goalkeeper"
        );
}


function recordSubstitution(
    playerOffId,
    playerOnId,
    role
) {

    const match =
        getCurrentMatch();

    if (
        !match ||
        match.finished ||
        !playerOffId ||
        !playerOnId ||
        !role ||
        playerOffId === playerOnId
    ) {
        return;
    }

    ensurePlayerTimeObject(match, playerOffId);
    ensurePlayerTimeObject(match, playerOnId);

    const timeOff =
        match.playerTimes[playerOffId];

    const timeOn =
        match.playerTimes[playerOnId];

    if (
        timeOff.activeStart === null ||
        timeOn.activeStart !== null
    ) {
        return;
    }

    const time =
        match.elapsedSeconds;

    const outgoingRole =
        timeOff.activeRole ||
        "outfield";

    /*
     * If the incoming substitute becomes goalkeeper while the
     * existing goalkeeper stays on the pitch, split the current
     * goalkeeper's spell at this exact match time and continue
     * that player as an outfield player.
     */
    const currentGoalkeeperId =
        match.currentGoalkeeperId ||
        match.goalkeeper ||
        null;

    if (
        role === "goalkeeper" &&
        currentGoalkeeperId &&
        currentGoalkeeperId !== playerOffId
    ) {
        const currentGoalkeeperTime =
            match.playerTimes[currentGoalkeeperId];

        if (
            currentGoalkeeperTime &&
            currentGoalkeeperTime.activeStart !== null &&
            currentGoalkeeperTime.activeRole === "goalkeeper"
        ) {
            currentGoalkeeperTime.intervals.push({
                start: currentGoalkeeperTime.activeStart,
                end: time,
                role: "goalkeeper"
            });

            currentGoalkeeperTime.activeStart = time;
            currentGoalkeeperTime.activeRole = "outfield";
        }
    }

    /* Close the outgoing player's current spell. */
    timeOff.intervals.push({
        start: timeOff.activeStart,
        end: time,
        role: outgoingRole
    });

    timeOff.activeStart = null;
    timeOff.activeRole = null;

    /* Start the incoming player's spell in the selected role. */
    timeOn.activeStart = time;
    timeOn.activeRole = role;

    if (role === "goalkeeper") {
        match.currentGoalkeeperId = playerOnId;
    } else if (currentGoalkeeperId === playerOffId) {
        match.currentGoalkeeperId = null;
    }

    match.events.push({
        id: generateId(),
        type: "substitution",
        elapsedSeconds: time,
        playerOff: playerOffId,
        playerOn: playerOnId,
        role,
        playerOffRole: outgoingRole
    });

    saveCurrentMatch(match);
    closeSubstitutionPanel();
    renderLiveMatch();
}

/* =========================================================
   PLAYER TIME DATA
   ========================================================= */

function ensurePlayerTimeObject(
    match,
    playerId
) {

    if (!match.playerTimes) {
        match.playerTimes = {};
    }


    if (!match.playerTimes[playerId]) {

        match.playerTimes[playerId] = {

            intervals: [],

            activeStart: null,

            activeRole: null

        };

    }


    if (
        !Array.isArray(
            match.playerTimes[playerId].intervals
        )
    ) {

        match.playerTimes[playerId]
            .intervals = [];

    }

}


/* =========================================================
   PLAYER ROLE TIME
   ========================================================= */

function getPlayerRoleSeconds(
    match,
    playerId,
    role
) {

    ensurePlayerTimeObject(
        match,
        playerId
    );


    const time =
        match.playerTimes[playerId];


    let total = 0;


    time.intervals.forEach(
        function (interval) {

            if (
                typeof interval.start !==
                    "number" ||
                typeof interval.end !==
                    "number"
            ) {
                return;
            }


            const intervalRole =
                interval.role ||
                (
                    playerId ===
                    match.goalkeeper
                        ? "goalkeeper"
                        : "outfield"
                );


            if (
                intervalRole === role
            ) {

                total += Math.max(
                    0,
                    interval.end -
                    interval.start
                );

            }

        }
    );


    if (
        time.activeStart !== null &&
        time.activeRole === role
    ) {

        total += Math.max(
            0,
            match.elapsedSeconds -
            time.activeStart
        );

    }


    return total;
}


function getPlayerSecondsPlayed(
    match,
    playerId
) {

    return (
        getPlayerRoleSeconds(
            match,
            playerId,
            "outfield"
        ) +
        getPlayerRoleSeconds(
            match,
            playerId,
            "goalkeeper"
        )
    );
}


function finalisePlayerTimes(match) {

    if (!match.playerTimes) {
        match.playerTimes = {};
    }


    match.matchdaySquad.forEach(
        function (playerId) {

            ensurePlayerTimeObject(
                match,
                playerId
            );


            const time =
                match.playerTimes[playerId];


            if (
                time.activeStart !== null
            ) {

                time.intervals.push({

                    start:
                        time.activeStart,

                    end:
                        match.elapsedSeconds,

                    role:
                        time.activeRole ||
                        (
                            playerId ===
                            match.goalkeeper
                                ? "goalkeeper"
                                : "outfield"
                        )

                });


                time.activeStart = null;

                time.activeRole = null;
            }

        }
    );
}


/* =========================================================
   REBUILD PLAYER TIMES
   ========================================================= */

function rebuildPlayerTimes(match) {

    match.playerTimes = {};

    (match.matchdaySquad || []).forEach(function (playerId) {
        match.playerTimes[playerId] = {
            intervals: [],
            activeStart: null,
            activeRole: null
        };
    });

    (match.startingFive || []).forEach(function (playerId) {
        if (!match.playerTimes[playerId]) {
            return;
        }

        match.playerTimes[playerId].activeStart = 0;
        match.playerTimes[playerId].activeRole =
            playerId === match.goalkeeper
                ? "goalkeeper"
                : "outfield";
    });

    let currentGoalkeeperId =
        match.goalkeeper ||
        null;

    const substitutionEvents =
        (match.events || [])
            .filter(function (event) {
                return event.type === "substitution";
            })
            .sort(function (a, b) {
                return (a.elapsedSeconds || 0) - (b.elapsedSeconds || 0);
            });

    substitutionEvents.forEach(function (event) {
        const offId = event.playerOff;
        const onId = event.playerOn;

        if (!offId || !onId) {
            return;
        }

        ensurePlayerTimeObject(match, offId);
        ensurePlayerTimeObject(match, onId);

        const off = match.playerTimes[offId];
        const on = match.playerTimes[onId];
        const time = Number(event.elapsedSeconds || 0);
        const role = event.role ||
            (offId === currentGoalkeeperId ? "goalkeeper" : "outfield");

        /* Incoming goalkeeper replaces the role of the current GK
           even when the current GK is not the player coming off. */
        if (
            role === "goalkeeper" &&
            currentGoalkeeperId &&
            currentGoalkeeperId !== offId
        ) {
            const oldGk = match.playerTimes[currentGoalkeeperId];

            if (
                oldGk &&
                oldGk.activeStart !== null &&
                oldGk.activeRole === "goalkeeper"
            ) {
                oldGk.intervals.push({
                    start: oldGk.activeStart,
                    end: time,
                    role: "goalkeeper"
                });

                oldGk.activeStart = time;
                oldGk.activeRole = "outfield";
            }
        }

        if (off.activeStart !== null) {
            off.intervals.push({
                start: off.activeStart,
                end: time,
                role: off.activeRole ||
                    (offId === currentGoalkeeperId ? "goalkeeper" : "outfield")
            });

            off.activeStart = null;
            off.activeRole = null;
        }

        on.activeStart = time;
        on.activeRole = role;

        if (role === "goalkeeper") {
            currentGoalkeeperId = onId;
        } else if (offId === currentGoalkeeperId) {
            currentGoalkeeperId = null;
        }
    });

    match.currentGoalkeeperId = currentGoalkeeperId;
}

/* =========================================================
   UNDO
   ========================================================= */

function undoLastEvent() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.events.length === 0
    ) {

        alert(
            "There are no events to undo."
        );

        return;
    }


    if (
        !confirm(
            "Undo the last event?"
        )
    ) {
        return;
    }


    const event =
        match.events[
            match.events.length - 1
        ];


    match.events.pop();


    if (
        event.type === "goal"
    ) {

        match.score.us =
            Math.max(
                0,
                match.score.us - 1
            );

    }


    if (
        event.type === "halfTime"
    ) {

        match.half = 1;

    }


    if (
        event.type === "substitution"
    ) {
        rebuildPlayerTimes(match);
    }


    saveCurrentMatch(match);


    renderLiveMatch();
}


/* =========================================================
   LIVE PLAYER STATS
   ========================================================= */

function getPlayerGoals(
    match,
    playerId
) {

    return (
        match.events || []
    ).filter(function (event) {

        return (
            event.type === "goal" &&
            event.scorer === playerId
        );

    }).length;
}


function getPlayerAssists(
    match,
    playerId
) {

    return (
        match.events || []
    ).filter(function (event) {

        return (
            event.type === "goal" &&
            event.assist === playerId
        );

    }).length;
}


function renderLiveStats() {

    const match =
        getCurrentMatch();


    if (!match) {
        return;
    }


    const players =
        getPlayers().filter(
            function (player) {

                return match.matchdaySquad.includes(
                    player.id
                );

            }
        );


    $("liveStatsList").innerHTML =
        players.map(function (player) {

            const totalSeconds =
                getPlayerSecondsPlayed(
                    match,
                    player.id
                );


            const outfieldSeconds =
                getPlayerRoleSeconds(
                    match,
                    player.id,
                    "outfield"
                );


            const goalkeeperSeconds =
                getPlayerRoleSeconds(
                    match,
                    player.id,
                    "goalkeeper"
                );


            const goals =
                getPlayerGoals(
                    match,
                    player.id
                );


            const assists =
                getPlayerAssists(
                    match,
                    player.id
                );


            const time =
                match.playerTimes &&
                match.playerTimes[player.id];


            const onPitch =
                time &&
                time.activeStart !== null;


            const currentRole =
                onPitch &&
                time.activeRole ===
                "goalkeeper"
                    ? "GK"
                    : onPitch
                        ? "Outfield"
                        : "Bench";


            return `
                <div
                    class="live-stats-row${
                        onPitch
                            ? " on-pitch"
                            : ""
                    }"
                >

                    <div class="live-stats-player">

                        <span class="live-stats-player-name">
                            ${escapeHtml(
                                player.name
                            )}
                        </span>

                        <span class="live-stats-player-status">
                            ${currentRole}
                        </span>

                    </div>


                    <div class="live-stat-value">
                        ${formatTime(
                            totalSeconds
                        )}
                    </div>


                    <div class="live-stat-value">
                        ${formatTime(
                            outfieldSeconds
                        )}
                    </div>


                    <div class="live-stat-value">
                        ${formatTime(
                            goalkeeperSeconds
                        )}
                    </div>


                    <div class="live-stat-value">
                        ${goals}
                    </div>


                    <div class="live-stat-value">
                        ${assists}
                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   LIVE RENDERING
   ========================================================= */

function renderLiveMatch() {

    const match =
        getCurrentMatch();


    if (!match) {
        return;
    }


    $("liveOpponent").textContent =
        match.opponent;


    $("liveScore").textContent =
        match.score.us +
        " - " +
        match.score.them;


    $("halfLabel").textContent =
        match.half === 1
            ? "1st Half"
            : "2nd Half";


    updateTimerDisplay();


    $("pauseBtn").textContent =
        match.running
            ? "Pause"
            : "Resume";


    renderLiveStats();
}


/* =========================================================
   FINISH MATCH
   ========================================================= */

function finishMatch() {

    const match =
        getCurrentMatch();


    if (
        !match ||
        match.finished
    ) {
        return;
    }


    if (
        !confirm(
            "Finish and save this match?"
        )
    ) {
        return;
    }


    stopTimer();


    match.running = false;


    finalisePlayerTimes(match);


    match.finished = true;


    match.finishedAt =
        new Date().toISOString();


    const matches =
        getMatches();


    matches.unshift(match);


    saveMatches(matches);


    clearCurrentMatch();


    state.setup = {

        matchdaySquad: [],

        startingFive: [],

        goalkeeper: null,

        captain: null

    };


    $("opponent").value = "";

    $("matchDate").value =
        todayString();


    renderHistory();

    renderHome();

    showScreen(
        "historyScreen"
    );
}


/* =========================================================
   DELETE HISTORIC MATCH
   ========================================================= */

function deleteHistoricMatch(
    matchId
) {

    const matches =
        getMatches();


    const match =
        matches.find(function (item) {

            return item.id === matchId;

        });


    if (!match) {
        return;
    }


    const confirmed =
        confirm(
            "Delete the match against " +
            match.opponent +
            " from your history?"
        );


    if (!confirmed) {
        return;
    }


    const updatedMatches =
        matches.filter(function (item) {

            return item.id !== matchId;

        });


    saveMatches(updatedMatches);


    renderHistory();

    renderHome();
}


/* =========================================================
   CSV
   ========================================================= */

function csvEscape(value) {

    const text =
        String(value ?? "");


    return (
        '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"'
    );
}


function slugify(value) {

    return String(
        value || "match"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );
}


function downloadCSV(match) {

    const rows = [];


    rows.push([

        "Match Date",
        "Opponent",
        "Score",
        "Player",
        "Minutes Played",
        "Outfield Minutes",
        "Goalkeeper Minutes",
        "Goals",
        "Assists",
        "Starting",
        "Goalkeeper",
        "Captain"

    ]);


    match.matchdaySquad.forEach(
        function (playerId) {

            const goals =
                getPlayerGoals(
                    match,
                    playerId
                );


            const assists =
                getPlayerAssists(
                    match,
                    playerId
                );


            const totalSeconds =
                getPlayerSecondsPlayed(
                    match,
                    playerId
                );


            const outfieldSeconds =
                getPlayerRoleSeconds(
                    match,
                    playerId,
                    "outfield"
                );


            const goalkeeperSeconds =
                getPlayerRoleSeconds(
                    match,
                    playerId,
                    "goalkeeper"
                );


            rows.push([

                match.date,

                match.opponent,

                match.score.us +
                    " - " +
                    match.score.them,

                getPlayerName(
                    playerId
                ),

                formatTime(
                    totalSeconds
                ),

                formatTime(
                    outfieldSeconds
                ),

                formatTime(
                    goalkeeperSeconds
                ),

                goals,

                assists,

                match.startingFive.includes(
                    playerId
                )
                    ? "Yes"
                    : "No",

                match.goalkeeper ===
                playerId
                    ? "Yes"
                    : "No",

                match.captain ===
                playerId
                    ? "Yes"
                    : "No"

            ]);

        }
    );


    const csv =
        rows.map(function (row) {

            return row
                .map(csvEscape)
                .join(",");

        }).join("\r\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;


    link.download =
        "football-match-" +
        slugify(
            match.opponent
        ) +
        "-" +
        match.date +
        ".csv";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   HISTORY
   ========================================================= */

function renderHistory() {

    const matches =
        getMatches();


    if (matches.length === 0) {

        $("matchHistory").innerHTML =
            '<div class="history-empty">No completed matches yet.</div>';

        return;
    }


    $("matchHistory").innerHTML =
        matches.map(function (match) {

            return renderHistoryMatch(
                match
            );

        }).join("");


    document
        .querySelectorAll(
            "[data-download-match]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const match =
                        getMatches().find(
                            function (item) {

                                return (
                                    item.id ===
                                    button.dataset.downloadMatch
                                );

                            }
                        );


                    if (match) {
                        downloadCSV(match);
                    }

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-match]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    deleteHistoricMatch(
                        button.dataset.deleteMatch
                    );

                }
            );

        });
}


function renderHistoryMatch(match) {

    const players =
        getPlayers();


    const playerRows =
        match.matchdaySquad.map(
            function (playerId) {

                const player =
                    players.find(
                        function (item) {

                            return (
                                item.id ===
                                playerId
                            );

                        }
                    );


                const name =
                    player
                        ? player.name
                        : "Unknown player";


                const goals =
                    getPlayerGoals(
                        match,
                        playerId
                    );


                const assists =
                    getPlayerAssists(
                        match,
                        playerId
                    );


                const totalSeconds =
                    getPlayerSecondsPlayed(
                        match,
                        playerId
                    );


                const outfieldSeconds =
                    getPlayerRoleSeconds(
                        match,
                        playerId,
                        "outfield"
                    );


                const goalkeeperSeconds =
                    getPlayerRoleSeconds(
                        match,
                        playerId,
                        "goalkeeper"
                    );


                return `
                    <div
                        class="history-player-row"
                    >

                        <div
                            class="history-player-name"
                        >
                            ${escapeHtml(name)}
                        </div>

                        <div
                            class="history-stat"
                            title="Total"
                        >
                            ${formatTime(
                                totalSeconds
                            )}
                        </div>

                        <div
                            class="history-stat"
                            title="Outfield"
                        >
                            ⚽ ${formatTime(
                                outfieldSeconds
                            )}
                        </div>

                        <div
                            class="history-stat"
                            title="Goalkeeper"
                        >
                            🧤 ${formatTime(
                                goalkeeperSeconds
                            )}
                        </div>

                        <div
                            class="history-stat"
                            title="Goals / Assists"
                        >
                            ${goals}/${assists}
                        </div>

                    </div>
                `;

            }
        ).join("");


    const goalEvents =
        match.events.filter(
            function (event) {

                return (
                    event.type ===
                    "goal"
                );

            }
        );


    const substitutionEvents =
        match.events.filter(
            function (event) {

                return (
                    event.type ===
                    "substitution"
                );

            }
        );


    let summary = "";


    if (goalEvents.length > 0) {

        summary +=
            "<strong>Goals:</strong> " +
            goalEvents.map(
                function (event) {

                    let text =
                        escapeHtml(
                            getPlayerName(
                                event.scorer
                            )
                        );


                    if (event.assist) {

                        text +=
                            " (" +
                            escapeHtml(
                                getPlayerName(
                                    event.assist
                                )
                            ) +
                            ")";

                    }


                    return text;

                }
            ).join(", ");

    }


    if (
        substitutionEvents.length > 0
    ) {

        if (summary) {
            summary += "<br>";
        }


        summary +=
            "<strong>Substitutions:</strong> " +
            substitutionEvents.map(
                function (event) {

                    return (
                        escapeHtml(
                            getPlayerName(
                                event.playerOff
                            )
                        ) +
                        " → " +
                        escapeHtml(
                            getPlayerName(
                                event.playerOn
                            )
                        )
                    );

                }
            ).join(", ");

    }


    return `
        <div class="history-match">

            <div class="history-match-header">

                <div class="history-match-title">

                    <strong>
                        vs ${escapeHtml(
                            match.opponent
                        )}
                    </strong>

                    <div class="history-match-date">
                        ${escapeHtml(
                            match.date
                        )}
                    </div>

                </div>


                <div class="history-score">
                    ${match.score.us}
                    -
                    ${match.score.them}
                </div>

            </div>


            <div class="history-details">

                ${playerRows}

            </div>


            ${
                summary
                    ? `
                        <div
                            class="history-event-summary"
                        >
                            ${summary}
                        </div>
                    `
                    : ""
            }


            <div class="history-actions">

                <button
                    type="button"
                    class="secondary-button"
                    data-download-match="${match.id}"
                >
                    Download CSV
                </button>


                <button
                    type="button"
                    class="secondary-button delete-match-button"
                    data-delete-match="${match.id}"
                >
                    Delete Match
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   MIGRATION
   ========================================================= */

function migrateMatchIfNecessary(
    match
) {

    if (!match) {
        return match;
    }


    if (!match.playerTimes) {

        match.playerTimes = {};


        (match.matchdaySquad || [])
            .forEach(function (playerId) {

                match.playerTimes[playerId] = {

                    intervals: [],

                    activeStart: null,

                    activeRole: null

                };

            });


        (match.startingFive || [])
            .forEach(function (playerId) {

                if (
                    match.playerTimes[playerId]
                ) {

                    match.playerTimes[playerId]
                        .intervals = [

                            {
                                start: 0,

                                end:
                                    match.elapsedSeconds ||
                                    0,

                                role:
                                    playerId ===
                                    match.goalkeeper
                                        ? "goalkeeper"
                                        : "outfield"
                            }

                        ];

                }

            });

    }


    if (!match.currentGoalkeeperId) {
        match.currentGoalkeeperId = match.goalkeeper || null;
    }


    /* Add role properties to old intervals */

    Object.keys(
        match.playerTimes || {}
    ).forEach(function (playerId) {

        const time =
            match.playerTimes[playerId];


        if (!Array.isArray(
            time.intervals
        )) {

            time.intervals = [];

        }


        time.intervals.forEach(
            function (interval) {

                if (!interval.role) {

                    interval.role =
                        playerId ===
                        match.goalkeeper
                            ? "goalkeeper"
                            : "outfield";

                }

            }
        );


        if (
            time.activeStart !== null &&
            !time.activeRole
        ) {

            time.activeRole =
                playerId ===
                match.goalkeeper
                    ? "goalkeeper"
                    : "outfield";

        }

    });


    return match;
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    $("addPlayerBtn")
        .addEventListener(
            "click",
            addPlayer
        );


    $("playerName")
        .addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addPlayer();

                }

            }
        );


    $("homeNewMatchBtn")
        .addEventListener(
            "click",
            function () {

                resetMatchSetup();

                showScreen(
                    "newMatchScreen"
                );

            }
        );


    $("startMatchBtn")
        .addEventListener(
            "click",
            startMatch
        );


    $("pauseBtn")
        .addEventListener(
            "click",
            togglePause
        );


    $("halfTimeBtn")
        .addEventListener(
            "click",
            recordHalfTime
        );


    $("goalBtn")
        .addEventListener(
            "click",
            openGoalPanel
        );


    $("cancelGoalBtn")
        .addEventListener(
            "click",
            closeGoalPanel
        );


    $("substitutionBtn")
        .addEventListener(
            "click",
            openSubstitutionPanel
        );


    $("cancelSubstitutionBtn")
        .addEventListener(
            "click",
            closeSubstitutionPanel
        );


    $("substitutionOutfieldBtn")
        .addEventListener(
            "click",
            function () {

                recordSubstitution(
                    state.substitutionOff,
                    state.substitutionOn,
                    "outfield"
                );

            }
        );


    $("substitutionGoalkeeperBtn")
        .addEventListener(
            "click",
            function () {

                recordSubstitution(
                    state.substitutionOff,
                    state.substitutionOn,
                    "goalkeeper"
                );

            }
        );


    $("undoBtn")
        .addEventListener(
            "click",
            undoLastEvent
        );


    $("finishMatchBtn")
        .addEventListener(
            "click",
            finishMatch
        );
}


/* =========================================================
   INITIALISE
   ========================================================= */

function initialise() {

    const dateInput =
        $("matchDate");


    if (!dateInput.value) {

        dateInput.value =
            todayString();

    }


    const currentMatch =
        getCurrentMatch();


    if (
        currentMatch &&
        !currentMatch.finished
    ) {

        const migrated =
            migrateMatchIfNecessary(
                currentMatch
            );


        saveCurrentMatch(
            migrated
        );


        startTimer();


        renderLiveMatch();


        showScreen(
            "liveScreen"
        );


        return;
    }


    renderHome();

    renderPlayers();

    renderMatchSetup();

    renderHistory();


    showScreen(
        "homeScreen"
    );
}


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupEventListeners();

        setupNavigation();

        initialise();

    }
);