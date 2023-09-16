const mysql = require('mysql')
const config = require('./config.json')

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
    host: config.rds_host,
    user: config.rds_user,
    password: config.rds_password,
    port: config.rds_port,
    database: config.rds_db
});
connection.connect((err) => err && console.log(err));

//NOT USED IN MY PAGES IMPLEMENTED
//route put group names
const author = async function(req, res) {
    const name = 'Blair Barineau, Rohan Kamat, Paavnee Chauhan, Aaron Finkelstein';

    // checks the value of type the request parameters
    // note that parameters are required and are specified in server.js in the endpoint by a colon (e.g. /author/:type)
    if (req.params.type === 'name') {
        // res.send returns data back to the requester via an HTTP response
        res.send(`Created by ${name}`);
    } else {
        // we can also send back an HTTP status code to indicate an improper request
        res.status(400).send(`'${req.params.type}' is not a valid author type. Valid type is 'name'.`);
    }
}


//NOT USED IN MY PAGES IMPLEMENTED -- should be in playlist rec page
//ROUTE 2
// This Route Dispays Playlists which have songs which best represent the dancebility desired by the user
const playlists_by_dancebility = async function(req, res) {

    const playtlists_to_display = req.params.playtlists_to_display ?? 10;
    //base values based on the averages for each attribute
    const dancebility = req.params.dancebility ?? 0.61;
    const tempo = req.params.tempo ?? 120.54;
    const loudness = req.params.loudness ?? -7.23;

    connection.query(`SELECT pid, name
    FROM Playlists
    WHERE avg_danceability IS NOT NULL
    ORDER BY ABS (avg_danceability - ${dancebility}), 
            ABS (avg_tempo - ${tempo}), 
            ABS (avg_loudness - ${loudness})
    LIMIT ${playtlists_to_display}
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//NOT USED IN MY PAGES IMPLEMENTED -- should be in playlist rec page
//ROUTE 3
    //This route finds the average dancebility from an artist and finds playlists which best match the dancebility
    // of that artist. Essentially we are finding playlists which best match the vibe of an artist
const playlist_from_artist_vibe = async function(req, res) {

    const artistName = req.params.artistName;
    const playtlists_to_display = req.params.playtlists_to_display ?? 10;

    connection.query(`SELECT pid, name
        FROM Playlists
        ORDER BY ABS (avg_danceability - (SELECT AVG(danceability) 
        FROM Songs 
        WHERE artist_name = ${artistName}))
        LIMIT ${playtlists_to_display}

  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//NOT USED IN MY PAGES IMPLEMENTED -- should be in playlist rec page
//ROUTE 4
    //This route displays playlists which contain the most songs from a user inputed artist
const playlists_with_artists = async function(req, res) {

    const artistName = req.params.artistName;
    const playtlists_to_display = req.params.songs_to_display ?? 10;

    connection.query(`
        SELECT plays.pid, plays.name, COUNT(*) as numSongs
        FROM (Contains contain JOIN Songs song ON contain.Song_ID = song.track_uri)
        JOIN Playlists plays on contain.playlist_id = plays.pid
        WHERE song.artist_name = ${artistName}
        GROUP BY plays.pid
        ORDER BY numSongs DESC
        LIMIT ${playtlists_to_display}
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//NOT USED IN MY PAGES IMPLEMENTED -- should be in playlist rec page
//ROUTE 5
    //This displays and finds playlists with the most number of songs from an album
    //This route helps users find playlists which are an extension of an album essentially
const playlist_albumn = async function(req, res) {

    const albumName = req.params.albumName;
    const playtlists_to_display = req.params.playtlists_to_display ?? 10;

    connection.query(`
        SELECT plays.pid, plays.name, COUNT(*) as numSongs
        FROM (Contains contain JOIN Songs song ON contain.Song_ID = song.track_uri)
        JOIN Playlists plays on contain.playlist_id = plays.pid
        WHERE song.album_id = ${albumName}
        GROUP BY plays.pid
        ORDER BY numSongs DESC
        LIMIT ${playtlists_to_display}
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//DEPRECATED?
//ROUTE 6
// this displays playlists with the most songs from a user input decade
const decade_playlist = async function(req, res) {

    const decade = req.params.decade ?? 2000;
    const playtlists_to_display = req.params.playtlists_to_display ?? 10;

    connection.query(`
        SELECT p.pid, p.name, COUNT(*) AS num_songs
        FROM Playlists p
        JOIN Contains C on p.pid = C.Playlist_ID
        JOIN Songs S ON C.song_id = S.track_uri
        WHERE S.year >= ${decade} AND S.year < (${decade} + 10)
        GROUP BY p.pid, p.name
        ORDER BY num_songs DESC
        LIMIT ${playtlists_to_display};           

  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//I WILL TRY AND IMPLEMENT THIS INTO THE PLAYLIST INFO OR SEARCH PAGE
// ROUTE 7
    // This route displays songs which are not in the user input playlist which the user may enjoy    
const playlist_rec = async function(req, res) {

    const playlistID = req.params.playlistID;
    const songs_to_display = req.params.songs_to_display ?? 10;

    connection.query(`
    SELECT song.track_uri, song.track_name
    FROM (Contains contain JOIN Songs song ON contain.Song_ID = song.track_uri) JOIN Playlists plays ON contain.playlist_id = plays.pid
    WHERE song.track_uri NOT IN
          (SELECT Song_ID
           FROM Contains
           where Playlist_ID = ${playlistID})
    ORDER BY ABS ((plays.avg_danceability - song.danceability) + (plays.avg_energy - song.energy) + (plays.avg_valence - song.valence))
    LIMIT 10

  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

// Page: SongRecommendationPage, Use: displays 5 songs which users would like based on a user's inputted artist
// ROUTE 8
// WORKING
const song_artist_rec = async function(req, res) {
    console.log('song artist rec')
    const artistName = req.query.artist_name ?? '';
    console.log(artistName);
    connection.query(`
    WITH cte_artists AS (
        SELECT artist_name, avg_danceability, avg_energy, avg_valence
        FROM Artists
        WHERE artist_name = '${artistName}'),
        cte_songs AS (
        SELECT s.track_name, s.artist_name, s.track_uri, a.avg_danceability, a.avg_energy, a.avg_valence, s.album_name
        FROM Songs s
        INNER JOIN cte_artists a ON s.artist_name = a.artist_name),
   
        cte_plays AS (
        SELECT s.track_name, s.album_name, s.artist_name, s.track_uri, s.avg_danceability, s.avg_energy, s.avg_valence,
        p.avg_danceability as p_avg_danceability, p.avg_energy as p_avg_energy, p.avg_valence as p_avg_valence
        FROM cte_songs s
        INNER JOIN Contains c ON c.Song_ID = s.track_uri
        INNER JOIN Playlists p ON  c.playlist_ID = p.pid)
   
        SELECT DISTINCT *
        FROM cte_plays
        ORDER BY ABS((p_avg_energy - avg_danceability)
        + (p_avg_energy - avg_energy) + (p_avg_valence - avg_valence))
        LIMIT 5
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

// I WILL TRY AND IMPLEMENT THIS INTO THE SONG REC PAGE BUT RE CHECK QUERY PLS EDITED
//ROUTE 10
// This route displays songs by other artists which best match the artist inpurtted by the user         
    //eg if we input Kanye West, we will get JayZ and PushaT songs, ...
const song_rec = async function(req, res) {

    const artistName = req.query.artist_name ?? '';
    const songs_to_display = req.params.songs_to_display ?? 10;

    connection.query(`
       CREATE VIEW ArtistVibe(artist_name, dance, energy, valence) 
        AS (SELECT artist_name, AVG(danceability) as dance, 
        AVG(energy) as energy, AVG(valence) as valence
        FROM songs
        WHERE artist_name = ${artistName}
        GROUP BY aritst_name),
       SELECT song.track_uri, song.name
            FROM Songs JOIN ArtistVibe on song.artist_name = ArtistVibe.artist_name 
            WHERE song.artist_name <> ${artistName} AND song_id IN (SELECT contain.Song_ID
            FROM (Contains contain JOIN Songs song ON contain.Song_ID = song.track_uri)
            JOIN Playlists plays ON contain.playlist_id = plays.pid
            WHERE plays.pid IN (SELECT contain.Playlist_ID 
            FROM Contains contains JOIN Songs song ON contain.Song_ID = song.track_uri
            WHERE song.artist_name = ${artistName}))
            ORDER BY ABS ((song.danceability - ArtistVibe.dance)
            + (song.energy - ArtistVibe.energy) 
        + (song.avg_valence - ArtistVibe.valence)) DESC
        LIMIT 5
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

// NOT USED IN ANY OF MY PAGES
//ROUTE 11 return Song info
// This route displays the info on a song
const song = async function(req, res) {

    const song_id = req.params.song_id;

    connection.query(`
      SELECT track_name, album_name, duration_ms, release_date
      FROM Songs
      WHERE track_uri = ${song_id}
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//NOT USED IN ANY OF MY PAGES
//ROUTE 11 return Album info
// This route displays all the info for a album
const album = async function(req, res) {

    const album_name = req.params.album_id;
    // we have to choose both album_name and album_id for the
    connection.query(`
      SELECT track_name, album_name, duration_ms, release_date
      FROM Songs
      WHERE album_id = ${album_name} OR album_name = ${album_name}
      
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

// Page: PlaylistInfoPage, Use:return Playlist info and songs on a playlist info I FEEL LIKE THIS CAN BE OPTIMIZED W JOIN TOGET PLAYLIST NAME AND DELETE OTHER LATER QUERY
//ROUTE 11 return Playlist info and songs on a playlist info EDITED!!!!!!!!!!!!!!!
const playlists = async function(req, res) {

    const pid = req.params.pid;

        connection.query(`
        SELECT S.track_name, S.album_name, S.track_uri, S.artist_name
        FROM Contains c JOIN Songs S on c.Song_ID = S.track_uri
        WHERE Playlist_ID = ${pid}
        `, (err, data) => {
          if (err || data.length === 0) {
            res.json({});
          } else {
            res.json(data);
          }
        });
    
}


//THIS IS SUPER WEIRD WHY IS THIS BEING USED FOR ARTIST INFO PAGE ????
//ROUTE 12 return Artist info
// This route displays the info on songs given a playlist
const artists = async function(req, res) {

    const pid = req.params.pid;

    connection.query(`
      SELECT S.track_name, S.album_name, S.duration_ms, S.release_date
      FROM Contains c JOIN Songs S on c.Song_ID = S.track_uri
      WHERE Playlist_ID = ${pid};
      
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}


//ADDED ROUTES 

// Page: PlaylistSearchPage, Use: get name of playlists from pid, I THINK THIS SHOULD BE COMBINED WITH PLAYLISTS USING A JOIN (DIDNT DO THAT BC CONTAINS DOESNT HAVE PLAYLIST NAME)
const playlist = async function(req, res) {
    const pid = req.params.pid;

        connection.query(`
        SELECT DISTINCT name
        FROM Playlists
        WHERE pid = ${pid}
        `, (err, data) => {
          if (err || data.length === 0) {
            res.json({});
          } else {
            res.json(data[0]);
          }
        });
    
}

//NOT USED YET -- WILL TRY AND IMPLEMENT
// Route to get similar_playlists based on pid
const similar_playlists = async function(req, res) {

    const page = req.query.page;
    const page_size = req.query.page_size ?? 10
    const pid = req.params.pid;

  
    if (!page) {
    connection.query(`
    WITH play_vals AS (
        SELECT avg_danceability, avg_tempo, avg_loudness, avg_energy
        FROM Playlists
        WHERE pid = ${pid}
        )
        SELECT pid, name
        FROM Playlists, play_vals
        WHERE pid <> ${pid}
        ORDER BY (ABS (avg_danceability - play_vals.avg_danceability)+ ABS (avg_tempo - play_vals.avg_tempo) + ABS (avg_loudness - play_vals.avg_loudness) + ABS (avg_energy - play_vals.avg_energy))
        LIMIT 5        
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        //res.json(data[0]);
        res.json(data);
      }
    });

} else {
    connection.query(`
    WITH play_vals AS (
        SELECT avg_danceability, avg_tempo, avg_loudness, avg_energy
        FROM Playlists
        WHERE pid = ${pid}
        )
        SELECT pid, name
        FROM Playlists, play_vals
        WHERE pid <> ${pid}
        ORDER BY (ABS (avg_danceability - play_vals.avg_danceability)+ ABS (avg_tempo - play_vals.avg_tempo) + ABS (avg_loudness - play_vals.avg_loudness) + ABS (avg_energy - play_vals.avg_energy))
        LIMIT 5, ${page_size} 
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        //res.json(data[0]);
        res.json(data);
      }
    });
}

}

// Page: ArtistSearchPage, use: input artist name to get list of artists
// Page is working
const search_artist = async function(req, res) {

    const name = req.query.artist_name ?? '';
    console.log("Connected");
  
    connection.query(
      `
      SELECT DISTINCT artist_name 
      FROM Artists
      WHERE artist_name LIKE '${name}%'
      ORDER BY artist_name

    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
       // console.log(data);
        res.json(data);
      }
      });
  }

// NOT USED
const artist = async function(req, res) { //can we optimize this and the above query?
    // route that given an artist_name, returns all information about the artist
  
    connection.query(`
      SELECT *
      FROM Artists
      WHERE artist_name LIKE '${req.params.artist_name}%'
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data[0]);
      }
    });
  }


// Page: ArtistInfoPage, Use: get all albums of an artist 
// Page is working

const artist_albums = async function(req, res) {
    const page = req.query.page;
    const page_size = req.query.page_size ?? 10
   // console.log(req.params.artist_name);
    
    if (!page) {
    connection.query(`
    SELECT al.album_name FROM Albums al
    INNER JOIN Artists ar ON ar.artist_name = al.artist_name
    WHERE ar.artist_name = '${req.params.artist_name}'
    `, (err, data) => {
      if (err || data.length === 0) {
        res.json({});
      } else {
        res.json(data[0]);
      }
    });

} else {
    connection.query(`
    SELECT DISTINCT al.album_name FROM Albums al
    INNER JOIN Artists ar ON ar.artist_name = al.artist_name
    WHERE ar.artist_name = '${req.params.artist_name}'
    LIMIT ${page_size} 
    OFFSET ${(page-1)*(page_size)}
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
         res.json(data);
      }
    });

}
    
}

    
// Page: ArtistInfoPage, Use: get 5 similar artists given an artist
// Page is working

const similar_artists = async function(req, res) {

    const page = req.query.page;
    const page_size = req.query.page_size ?? 10
    const artist_input = req.params.artist_name;


    if (!page) {
    connection.query(`
    WITH cte_selected_artist AS (
        SELECT avg_danceability, avg_energy, avg_loudness, avg_tempo
        FROM Artists
        WHERE artist_name =  '${artist_input}' )
        
        SELECT p.pid 
        FROM Artists ar, cte_selected_artist cte
        ORDER BY (
        ABS(ar.avg_danceability - cte.avg_danceability) + ABS(ar.avg_energy - cte.avg_energy) + ABS(ar.avg_loudness - cte.avg_loudness) + ABS(ar.avg_tempo - cte.avg_tempo) )
        LIMIT 5'
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        //res.json(data[0]);
        res.json(data);
      }
    });

} else {
    connection.query(`
    WITH cte_selected_artist AS (
        SELECT avg_danceability, avg_energy, avg_loudness, avg_tempo
        FROM Artists
        WHERE artist_name =  '${artist_input}' )
        
        SELECT DISTINCT ar.artist_name 
        FROM Artists ar, cte_selected_artist cte
        ORDER BY (
        ABS(ar.avg_danceability - cte.avg_danceability) + ABS(ar.avg_energy - cte.avg_energy) + ABS(ar.avg_loudness - cte.avg_loudness) + ABS(ar.avg_tempo - cte.avg_tempo) )
        LIMIT 5, ${page_size} 
    `, (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        //res.json(data[0]);
        res.json(data);
      }
    });

} }


//NOT USED
const albumInfo = async function(req, res) {

    const album_name = req.params.album_name;

    connection.query(`
      SELECT *
      FROM Albums
      WHERE album_name LIKE '${album_name}%';
     
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

//NOT USED
const albums_songs = async function(req, res) {

    const album_name = req.params.pid;

    connection.query(`
        SELECT song_id, title, number, plays
        FROM Songs
        WHERE album_name = '${album_name}'
        ORDER BY number
     
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            res.json({});
        } else {
            res.json(data);
        }
    });
}

// Page: PlaylistSearchPage, Use: given a playlist name, returns that playlists info
// Page is working
const search_playlist = async function(req, res) {

   const name = req.query.name ?? '';
   console.log(name);
 
   connection.query(
     `
     SELECT DISTINCT pid, name, num_followers, num_artists, num_tracks, duration_ms
     FROM Playlists
     WHERE name LIKE '${name}%'
     ORDER BY name, num_followers DESC, duration_ms DESC

   `, (err, data) => {
     if (err || data.length === 0) {
       console.log(err);
       res.json({});
     } else {
      // console.log(data);
       res.json(data);
     }
     });
 }



// Page: SongRecommender, Use: return top 5 song rec from album input 
// Currently causing issues
 const song_album_rec = async function(req, res) {
    console.log("hello");
    console.log('song album rec')
    const albumName = req.params.album_name ?? '';
    console.log(albumName);

    connection.query(`
    SELECT DISTINCT song.track_uri, song.track_name, song.album_name, song.artist_name
    FROM Contains contain JOIN Songs song ON contain.Song_ID = song.track_uri
    JOIN Playlists plays ON contain.playlist_id = plays.pid
    JOIN Albums album ON song.album_name = album.album_name AND song.artist_name = album.artist_name
    WHERE album.album_name = '${albumName}'
    ORDER BY ABS((plays.avg_danceability - album.avg_danceability)
    + (plays.avg_energy - album.avg_energy) + (plays.avg_valence - album.avg_valence))
    LIMIT 5
  `, (err, data) => {
        if (err || data.length === 0) {
            console.log(err);
            
            res.json({});
        } else {
            console.log(data);
            res.json(data);
        }
    });
    
}


module.exports = {
    author,
    playlists_by_dancebility,
    playlist_from_artist_vibe,
    playlists_with_artists,
    playlist_albumn,
    decade_playlist,
    playlist_rec,
    song_artist_rec,
    song_rec,
    song,
    album,
    playlists,
    artists,
    search_artist,
    artist,
    albumInfo,
    albums_songs,
    artist_albums,
    similar_artists,
    similar_playlists,
    playlist,
    search_playlist,
    song_album_rec
}
