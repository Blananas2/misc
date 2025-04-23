using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using KModkit;
using System.Linq;
using System.IO;
using System;

/*	This is the main file used in LotsOfS' Stream Display Info mod for Keep Talking and Nobody Explodes, just edited to suit my 
    specific needs. Specifically, this is what I changed:
		- Removed creation and logic for all files except for 'solvecount' and 'strikecount'; I especially didn't care for the
		  'interacted mods' stuff, just adds clutter in my eye
		- Made solvecount in the format [solves]/[total]
		- Made strikecount in the format [strikes]X
		- Removed most log lines
  	Steam Workshop link to the mod: https://steamcommunity.com/sharedfiles/filedetails/?id=2449588759
    This mod's GitHub: https://github.com/lotsofs/KTANE-Mods/tree/master/StreamerInfo                                          */

public class StreamerInfo : MonoBehaviour {

	KMBombModule[] _allMods;

	List<string> _allModules;
	List<string> _solvedModules;
	List<string> _unsolvedModules;

	int _previousSolvesCount = 0;
	int _previousStrikes = 0;

	int _vanillaCount = 0;

	KMBombInfo _bombInfo;
	KMGameInfo _gameInfo;
	string _serial;

	string _recentlyFinishedSerial;

	string _settingsPath;

	// Use this for initialization
	void Start () {
		_bombInfo = GetComponent<KMBombInfo>();
		_gameInfo = GetComponent<KMGameInfo>();
		_gameInfo.OnStateChange += StateChange;
		MakeDirectory();
	}
	
	void StateChange(KMGameInfo.State state) {
		if (state == KMGameInfo.State.Setup || state == KMGameInfo.State.PostGame) {
			ResetValues();
		}
	} 

	void MakeDirectory() {
		_settingsPath = Path.Combine(Application.persistentDataPath, "StreamInfo");
		if (!Directory.Exists(_settingsPath)) {
			Directory.CreateDirectory(_settingsPath);
		}
		MakeFile("solvecount.txt", "");
		MakeFile("strikecount.txt", "");
	}

	void MakeFile(string fileName, string items) {
		string path = Path.Combine(_settingsPath, fileName);
		File.WriteAllText(path, items);
	}

	void MakeFile(string fileName, List<string> items, string separator =  "") {
		string text = string.Join(separator, items.ToArray());
		MakeFile(fileName, text);
	}

	void MakeFile(string fileName, List<KMBombModule> items, string separator = "") {
		List<string> mods = new List<string>();
		foreach (KMBombModule mod in items) {
			mods.Add(mod.ModuleDisplayName);
		}
		string text = string.Join(separator, mods.ToArray());
		MakeFile(fileName, text);
	}

	void AppendFile(string fileName, string line) {
		string path = Path.Combine(_settingsPath, fileName);
		if (File.Exists(path)) {
			File.AppendAllText(path, Environment.NewLine + line);
		}
		else {
			Debug.LogErrorFormat("[Stream Info] File {0} does not exist...", path);
		}
	}

	void GetModules() {
		_allMods = FindObjectsOfType<KMBombModule>();

		_allModules = _bombInfo.GetSolvableModuleNames();
		_unsolvedModules = _bombInfo.GetSolvableModuleNames();
		_solvedModules = new List<string>();

		_vanillaCount = _allModules.Count - _allMods.Length;
		if (_vanillaCount > 0) {
			Debug.LogFormat("[Stream Info] {0} Vanillas are present", _vanillaCount);
		}

		_previousSolvesCount = _bombInfo.GetSolvedModuleIDs().Count;
		_previousStrikes = _bombInfo.GetStrikes();

		MakeFile("solvecount.txt", string.Format("0/{0}", _allModules.Count));
		MakeFile("strikecount.txt", "0X");
	}

	void Solved(string module) {
		_unsolvedModules.Remove(module);
		MakeFile("solvecount.txt", string.Format("{0}/{1}", _bombInfo.GetSolvedModuleIDs().Count, _allModules.Count));
	}

	void Strike(int num) {
		MakeFile("strikecount.txt", num + "X");
	}

	// Update is called once per frame
	void Update () {
		if (_serial == null && _bombInfo.IsBombPresent()) {
			string newSerial = _bombInfo.GetSerialNumber();
			if (_recentlyFinishedSerial == newSerial) {
				// Bomb is still present even after it has exploded. Ignore it.
				return;
			}
			_serial = _bombInfo.GetSerialNumber();
			//_bombInfo.OnBombExploded += ResetValues;

			_previousSolvesCount = _bombInfo.GetSolvedModuleIDs().Count;
			GetModules();
			return;
		}
		else if (_serial == null) {
			return;
		}
		int currentSolvesCount = _bombInfo.GetSolvedModuleIDs().Count;
		if (currentSolvesCount > _previousSolvesCount) {
			_previousSolvesCount = currentSolvesCount;
			List<string> bombSolves = _bombInfo.GetSolvedModuleNames();
			foreach (string module in _solvedModules) {
				bombSolves.Remove(module);
			}
			_solvedModules.Add(bombSolves[0]);
			Solved(bombSolves[0]);
		}
		int currentStrikes = _bombInfo.GetStrikes();
		if (currentStrikes > _previousStrikes) {
			_previousStrikes = currentStrikes;
			Strike(currentStrikes);
		}

	}

	void ResetValues () { //leaving this here as it looks useful!
		_recentlyFinishedSerial = _serial;
		
		_serial = null;
		_previousSolvesCount = 0;
		_previousStrikes = 0;

		_allMods = null;

		_allModules = null;
		_solvedModules = null;
		_unsolvedModules = null;

		_vanillaCount = 0;
	}
}
