let globalData = null;

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
	if (!menuToggle) return;
    const nav = document.querySelector("nav");
	if (!nav) return;
    menuToggle.addEventListener("click", function () {
        nav.classList.toggle("active");
    });
});


document.addEventListener("DOMContentLoaded", function () {
	const selector = document.getElementById("data-version");
    // Load initial version
    fetchData("data_v2.json");

    // Listen for changes
	if (selector) {
		selector.addEventListener("change", function () {
			const selectedFile = selector.value;
			console.log("choosefile"+selectedFile);
			fetchData(selectedFile);
		});
	}


  // fetchData();
});

	
	function fetchData(dt) {
		fetch(dt)
			.then(response => response.json())
			.then(data => {
				globalData = data;
				loadTacticsAndTechniques(data);
				loadReferences(data);
				loadTactics(data);
				loadTechniques(data);
				loadMitigation(data);
				loadStats(data); 
			})
			.catch(error => console.error("Error loading data.json:", error));
	}
	
	function showMatrix(type) {
		currentMatrix = type;
		document.getElementById("threat-matrix-tab").classList.toggle("selected", type === "threat");
		document.getElementById("resilience-matrix-tab").classList.toggle("selected", type === "resilience");
		document.getElementById("stats-threat").style.display = (type === "threat") ? "block" : "none";
		document.getElementById("stats-nist").style.display = (type === "resilience") ? "block" : "none";
		const matrixContainer = document.getElementById("matrix-container");
		const resilienceContainer = document.getElementById("resilience-matrix-container");
		const effectsContainer = document.getElementById("effects-matrix-container");
		const effectsHeading = document.getElementById("effects-heading");
		if (type === "threat") {
			matrixContainer.removeAttribute("style");
			resilienceContainer.style.display = "none";
			effectsContainer.style.display = "none";
			effectsHeading.style.display = "none";

			loadTacticsAndTechniques(globalData);
		} else if (type === "resilience") {
			resilienceContainer.removeAttribute("style");
			effectsContainer.removeAttribute("style");
			effectsHeading.style.display = "block";
			matrixContainer.style.display = "none";
			loadNISTMatrix(globalData);
		}
	}

	function loadTacticsAndTechniques(data){
		const matrixContainer = document.getElementById("matrix-container");
		if (!matrixContainer) {
			console.warn("matrix-container not found");
			return;
		}		
		data.tactics.forEach(tactic => {
			let tacticDiv = document.createElement("div");
			tacticDiv.classList.add("tactic");
			tacticDiv.innerHTML = `<b><a href="#" onclick="showPopup('${tactic.ID}', 'tactic', globalData)">${tactic.name}</a></b>`;
			
			tactic["technique ID"].forEach(techId => {
				let tech = data.techniques.find(t => t.ID === techId);
				if (tech) {
					let techDiv = document.createElement("div");
					techDiv.classList.add("techniques");					
					let toggleButton = "";
					if (tech["sub-technique ID"].length > 0) {
						toggleButton = `<button class="toggle-btn" onclick="toggleSubTechniques(event, '${tech.ID}')">[+]</button>`;
					}					
					techDiv.innerHTML = `${toggleButton} <a href="#" onclick="showPopup('${tech.ID}', 'technique', globalData)">${tech.name}</a>`;
					
					let subTechContainer = document.createElement("div");
					subTechContainer.id = `sub-tech-${tech.ID}`;
					subTechContainer.classList.add("sub-techniques");					
					tech["sub-technique ID"].forEach(subTechId => {
						let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
						if (subTech) {
							let subTechDiv = document.createElement("div");
							subTechDiv.classList.add("sub-techniques-item")
							subTechDiv.innerHTML = `<a href="#" onclick="showPopup('${subTech.ID}', 'sub-technique', globalData)">${subTech.name}</a>`;
							subTechContainer.appendChild(subTechDiv);
						}
					});					
					techDiv.appendChild(subTechContainer);
					tacticDiv.appendChild(techDiv);
				}
			});			
			matrixContainer.appendChild(tacticDiv);
		});
	}	

	function loadNISTMatrix(data) {
		const resilienceContainer = document.getElementById("resilience-matrix-container");
		const effectsContainer = document.getElementById("effects-matrix-container");
		if (!resilienceContainer || !effectsContainer || !data.NIST_CRS) return;

		resilienceContainer.innerHTML = "";
		effectsContainer.innerHTML = "";

		const nistTechniques = data.NIST_CRS.techniques || [];
		const nistApproaches = data.NIST_CRS.approaches || [];
		nistTechniques.forEach(tech => {
			let tacticDiv = document.createElement("div");
			tacticDiv.classList.add("tactic");
			tacticDiv.innerHTML = `<b><a href="#" onclick="showPopup('${tech.id}', 'nist-technique', globalData)">${tech.name}</a></b>`;

			tech.approach_ids.forEach(approachId => {
				const app = nistApproaches.find(a => a.id === approachId);
				if (app) {
					let approachDiv = document.createElement("div");
					approachDiv.classList.add("techniques");
					approachDiv.innerHTML = `<a href="#" onclick="showPopup('${app.id}', 'approach', globalData)">${app.name}</a>`;
					tacticDiv.appendChild(approachDiv);
				}
			});
			resilienceContainer.appendChild(tacticDiv);
		});
		
		const highLevelEffects = data.NIST_CRS.high_level_effects || [];
		const lowLevelEffects = data.NIST_CRS.low_level_effects || [];
		highLevelEffects.forEach(highEffect => {
			let effectDiv = document.createElement("div");
			effectDiv.classList.add("tactic");
			effectDiv.innerHTML = `<b><a href="#" onclick="showPopup('${highEffect.id}', 'high-effect', globalData)">${highEffect.name}</a></b>`;

			highEffect.low_level_effects_ids.forEach(lowId => {
				const lowEffect = lowLevelEffects.find(le => le.id === lowId);
				if (lowEffect) {
					let lowDiv = document.createElement("div");
					lowDiv.classList.add("techniques");
					lowDiv.innerHTML = `<a href="#" onclick="showPopup('${lowEffect.id}', 'low-effect', globalData)">${lowEffect.name}</a>`;
					effectDiv.appendChild(lowDiv);
				}
			});
			effectsContainer.appendChild(effectDiv);
		});
	}


	
	function loadTactics(data){
		tactics = data.tactics;
		const tacticTable = document.getElementById("tactics-table");
		if (!tacticTable) return;
		tacticTable.innerHTML = "";

		tactics.forEach(tactic => {
			let row = document.createElement("tr");
			row.innerHTML = `
				<td>${tactic.ID}</td>
				<td class="clickable"><a href="#" onclick="showPopup('${tactic.ID}', 'tactic', globalData)">${tactic.name}</a></td>
				<td>${tactic.short_description || "No description available."}</td>
			`;
			tacticTable.appendChild(row);
		});
	};
	
	function loadTechniques(data){
		techniques = data.techniques;
		const techniqueTable = document.getElementById("techniques-table");
		if (!techniqueTable) return;
		techniqueTable.innerHTML = "";

		techniques.forEach(technique => {
			let row = document.createElement("tr");
			row.innerHTML = `
				<td>${technique.ID}</td>
				<td class="clickable"><a href="#" onclick="showPopup('${technique.ID}', 'technique', globalData)">${technique.name}</a></td>
				<td>${technique.short_description || "No description available."}</td>
			`;
			techniqueTable.appendChild(row);
		});
	};
	
	
	function loadMitigation(data) {
		const mitigations = data.mitigations;
		const mitigationTable = document.getElementById("mitigations-table");
		if (!mitigationTable) return;

		const approachesMap = {};
		const effectsMap = {};

		// Build maps for fast lookup
		if (data.NIST_CRS) {
			(data.NIST_CRS.approaches || []).forEach(a => approachesMap[a.id] = a);
			(data.NIST_CRS.effects || []).forEach(e => effectsMap[e.id] = e);
		}

		mitigationTable.innerHTML = "";

		mitigations.forEach(mitigation => {
			const approachLinks = (mitigation.NISTCRS_approaches || []).map(id => {
				const approach = approachesMap[id];
				return approach
					? `<a href="#" onclick="showPopup('${id}', 'approach', globalData)">${approach.name}</a>`
					: `<span>${id}</span>`;
			}).join(", ");

			const groupedEffects = {};
			const lowEffects = data.NIST_CRS?.low_level_effects || [];
			const highEffects = data.NIST_CRS?.high_level_effects || [];

			// Map low-level IDs in this mitigation to their high-level parents
			(mitigation.NISTCRS_effects || []).forEach(lowId => {
				const high = highEffects.find(h => h.low_level_effects_ids.includes(lowId));
				const low = lowEffects.find(l => l.id === lowId);
				if (high && low) {
					if (!groupedEffects[high.id]) {
						groupedEffects[high.id] = {
							high: high,
							low: []
						};
					}
					groupedEffects[high.id].low.push(low);
				}
			});

		
			const effectLines = Object.values(groupedEffects).map(group => {
				const highLink = `<a href="#" onclick="showPopup('${group.high.id}', 'high-effect', globalData)">${group.high.name}</a>`;
				const lowLinks = group.low.map(le => `<a href="#" onclick="showPopup('${le.id}', 'low-effect', globalData)">${le.name}</a>`).join(", ");
				return `${highLink}: ${lowLinks}`;
			}).join("<br>");

			let row = document.createElement("tr");
			row.innerHTML = `
				<td>${mitigation.ID}</td>
				<td class="clickable">
					<a href="#" onclick="showPopup('${mitigation.ID}', 'mitigation', globalData)">${mitigation.name}</a>
				</td>
				<td>${mitigation.short_description || "No description available."}</td>
				<td class="clickable">${approachLinks || "-"}</td>
				<td class="clickable" style="font-size: 12px; line-height: 1.6em;">${effectLines || "-"}</td>
			`;
			mitigationTable.appendChild(row);
		});		
	}


	
	function loadReferences(data) {
		references = data.references;
		const referenceTable = document.getElementById("references-table");
		if (!referenceTable) return;
		
		referenceTable.innerHTML = ""; // Clear previous data

		references.forEach(ref => {
			let row = document.createElement("tr");
			row.innerHTML = `
				<td>${ref.ID}</td>
				<td class="clickable"><a href="#" onclick="showRefPopup(${JSON.stringify(ref).replace(/"/g, '&quot;')})">${ref.name}</a></td>
				<td><a href="${ref.link}" target="_blank">&#128065;</a></td>
			`;
			referenceTable.appendChild(row);
		});
	}

	function loadStats(data) {
		const tactics = data.tactics || [];
		const techniques = data.techniques || [];
		const subtechniques = data["sub-techniques"] || [];
		const references = data.references || [];
		
		const nistTechniques = data.NIST_CRS?.techniques || [];
		const nistApproaches = data.NIST_CRS?.approaches || [];
		const nistEffects = data.NIST_CRS?.effects || [];
		const mitigations = data.mitigations || [];
		
		const threatStats = document.getElementById("stats-threat");
		if (threatStats) {
			threatStats.textContent = `Number of tactics: ${tactics.length} | Number of techniques: ${techniques.length} | Number of sub-techniques: ${subtechniques.length} | Number of references: ${references.length}`;
		}
		const nistStats = document.getElementById("stats-nist");
		if (nistStats) {
			nistStats.textContent = `Number of NIST Techniques: ${nistTechniques.length} | Number of NIST Approaches: ${nistApproaches.length} | Number of NIST Effects: ${nistEffects.length}`;		
		}
		
		const tacticsStats = document.getElementById("tactics-stats");
		if (tacticsStats) {
			tacticsStats.textContent = `Number of tactics: ${tactics.length}`;
		}
		const techniquesStats = document.getElementById("techniques-stats");
		if (techniquesStats) {
			techniquesStats.textContent = `Number of techniques: ${techniques.length} | Number of sub-techniques: ${subtechniques.length}`;
		}
		const referencesStats = document.getElementById("references-stats");
		if (referencesStats) {
			referencesStats.textContent = `Number of references: ${references.length}`;
		}		
		const mitigationStats = document.getElementById("mitigations-stats");
		if (mitigationStats) {
			mitigationStats.textContent = `Number of mitigations: ${mitigations.length}`;
		}
	}


	
    function toggleSubTechniques(event, techID) {
        event.stopPropagation();
        let subTechContainer = document.getElementById(`sub-tech-${techID}`);
        if (subTechContainer.style.display === "none" || subTechContainer.style.display === "") {
            subTechContainer.style.display = "block";
            event.target.textContent = "[-]";
        } else {
            subTechContainer.style.display = "none";
            event.target.textContent = "[+]";
        }
    }
    
    function showPopup(id, type, data) {
		let popupBody = document.getElementById("popup-body");
		let item;
		if (type === "tactic") {item = data.tactics.find(t => t.ID === id);} 
		else if (type === "technique") {item = data.techniques.find(t => t.ID === id);} 
		else if (type === "sub-technique") {item = data["sub-techniques"].find(st => st.ID === id);} 
		else if (type === "mitigation") {item = data.mitigations.find(m => m.ID === id);} 
		else if (type === "nist-technique") {item = data.NIST_CRS?.techniques?.find(t => t.id === id);}
		else if (type === "approach") {item = data.NIST_CRS?.approaches?.find(a => a.id === id);} 
		else if (type === "high-effect") {item = data.NIST_CRS?.high_level_effects?.find(e => e.id === id);} 
		else if (type === "low-effect") {item = data.NIST_CRS?.low_level_effects?.find(e => e.id === id);}

		if (!item) return;
		
		let content = `<h2>${item.name}</h2>`;
		content += `<p><i>ID:</i> ${item.ID}</p>`;
		content += `<p><strong>Created:</strong> ${item.created} | <strong>Last Modified:</strong> ${item.modified}</p>`;
		content += `<h3>Description:</h3> <p>${item.short_description ? item.short_description
					.replace(/\n/g, "<br><br>")
					.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")	: "No short description available."}</p>`;

		content += `<p>${item.full_description ? item.full_description
					.replace(/\n/g, "<br><br>")  
					.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;") : "No full description available."}</p>`;
		
		if (type === "tactic" && item["technique ID"].length > 0) {
			content += `<h3>Techniques</h3>`;
			content += `<table border="1" width="100%">
				<tr><th>ID</th><th>Name</th><th>Description</th></tr>`;
			item["technique ID"].forEach(techId => {
				let tech = data.techniques.find(t => t.ID === techId);
				if (tech) {
					content += `<tr><td>${tech.ID}</td>
								<td><a href="#" onclick="showPopup('${tech.ID}', 'technique', globalData)">${tech.name}</a></td>
								<td>${tech.short_description}</td></tr>`;
					tech["sub-technique ID"].forEach(subTechId => {
						let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
						if (subTech) {
							content += `<tr class="sub-technique-row">
										<td>${subTech.ID}</td>
										<td><a href="#" onclick="showPopup('${subTech.ID}', 'sub-technique', globalData)">${subTech.name}</a></td>
										<td>${subTech.short_description}</td></tr>`;
						}
					});
				}
			});
			content += `</table>`;
		}
		
		if (type === "technique") {
			if (item["sub-technique ID"].length > 0) {
				content += `<h3>Sub-Techniques</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Description</th></tr>`;
				item["sub-technique ID"].forEach(subTechId => {
					let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
					if (subTech) {
						content += `<tr class="sub-technique-row">
									<td>${subTech.ID}</td>
									<td><a href="#" onclick="showPopup('${subTech.ID}', 'sub-technique', globalData)">${subTech.name}</a></td>
									<td>${subTech.short_description}</td></tr>`;
					}
				});
				content += `</table>`;
			}
			
			if (item["example"].length > 0) {
				content += `<h3>Examples</h3><table border="1" width="100%">
					<tr><th>Reference</th><th>Description</th></tr>`;
				item["example"].forEach(ex => {
					let ref = data.references.find(r => r.ID === ex["reference ID"]);
					let refLink = ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
					content += `<tr><td class="examref">${refLink}</td><td>${ex.description}</td></tr>`;
				});
				content += `</table>`;
			}
			
			if (item["mitigation ID"].length > 0) {
				content += `<h3>Mitigations</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Description</th><th>Reference</th></tr>`;
				item["mitigation ID"].forEach(mitId => {
					let mit = data.mitigations.find(m => m.ID === mitId);
					let refLinks = mit["reference ID"].map(refId => {
						let ref = data.references.find(r => r.ID === refId);
						return ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
					}).join(", ");
					content += `<tr><td>${mit.ID}</td><td>${mit.name}</td><td>${mit.description}</td><td>${refLinks}</td></tr>`;
				});
				content += `</table>`;
			}
			
			if (item["reference ID"]?.length > 0) {
				content += `<h3>References</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Link</th></tr>`;
				item["reference ID"].forEach(refId => {
					let ref = data.references.find(r => r.ID === refId);
					if (ref) {
						content += `<tr>
									<td>${ref.ID}</td>
									<td class="clickable"><a href="#" onclick="showRefPopup(${JSON.stringify(ref).replace(/"/g, '&quot;')})">${ref.name}</a></td>
									<td><a href="${ref.link}" target="_blank">&#128065;</a></td>
									</tr>`;
					}
				});
				content += `</table>`;
			} else {
				content += `<p><h3>References:</h3> No references available.</p>`;
			}
		}
		// Handle sub-technique type
		if (type === "sub-technique") {
			if (item["example"]?.length > 0) {
				content += `<h3>Examples</h3><table border="1" width="100%">
					<tr><th>Reference</th><th>Description</th></tr>`;
				item["example"].forEach(ex => {
					let ref = data.references.find(r => r.ID === ex["reference ID"]);
					let refLink = ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
					content += `<tr><td class="examref">${refLink}</td><td>${ex.description}</td></tr>`;
				});
				content += `</table>`;
			}
			
			if (item["mitigation ID"]?.length > 0) {
				content += `<h3>Mitigations</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Description</th><th>Reference</th></tr>`;
				item["mitigation ID"].forEach(mitId => {
					let mit = data.mitigations.find(m => m.ID === mitId);
					let refLinks = mit["reference ID"].map(refId => {
						let ref = data.references.find(r => r.ID === refId);
						return ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
					}).join(", ");
					content += `<tr><td>${mit.ID}</td><td>${mit.name}</td><td>${mit.description}</td><td>${refLinks}</td></tr>`;
				});
				content += `</table>`;
			}
			
			if (item["reference ID"]?.length > 0) {
				content += `<h3>References</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Link</th></tr>`;
				item["reference ID"].forEach(refId => {
					let ref = data.references.find(r => r.ID === refId);
					if (ref) {
						content += `<tr>
									<td>${ref.ID}</td>
									<td class="clickable"><a href="#" onclick="showRefPopup(${JSON.stringify(ref).replace(/"/g, '&quot;')})">${ref.name}</a></td>
									<td><a href="${ref.link}" target="_blank">&#128065;</a></td>
									</tr>`;
					}
				});
				content += `</table>`;
			} else {
				content += `<p><h3>References:</h3> No references available.</p>`;
			}
		}
		
		// Handle mitigation type
        if (type === "mitigation") {
            item = data.mitigations.find(m => m.ID === id);
            if (!item) return;
            content = `<h2>${item.name}</h2>`;
			content += `<p><i>ID:</i> ${item.ID}</p>`;
			content += `<p><strong>Created:</strong> ${item.created} | <strong>Last Modified:</strong> ${item.modified}</p>`;
			content += `<h3>Description</h3><p>${item.short_description}</p><p>${item.full_description}</p>`;

            // Show mapped techniques
            if (item.techniques?.length > 0) {
                content += `<h3>Mapped Techniques</h3><ul>`;
                item.techniques.forEach(tid => {
                    const t = data.techniques.find(t => t.ID === tid);
                    content += t
                        ? `<a href="#" onclick="showPopup('${t.ID}', 'technique', globalData)">${t.name}</a>, `
                        : `No attack technique can be mapped`;
                });
                content += `</ul>`;
            }

            // NIST Approaches
			if (item.NISTCRS_approaches?.length > 0) {
				content += `<h3>NIST Approaches</h3>`;
				const links = item.NISTCRS_approaches.map(aid => {
					const app = data.NIST_CRS?.approaches?.find(a => a.id === aid);
					return app ? `<a href="#" onclick="showPopup('${app.id}', 'approach', globalData)">${app.name}</a>` : aid;
				});
				content += `<p>${links.join(", ")}</p>`;
			}

            // Show NIST Effects (Grouped by High-Level)
			if (item.NISTCRS_effects?.length > 0) {
				content += `<h3>NIST Effects</h3>`;
				const lowEffects = data.NIST_CRS?.low_level_effects || [];
				const highEffects = data.NIST_CRS?.high_level_effects || [];
				const relevantLow = lowEffects.filter(le => item.NISTCRS_effects.includes(le.id));
				const grouped = {};
				highEffects.forEach(high => {
					high.low_level_effects_ids.forEach(lowId => {
						if (item.NISTCRS_effects.includes(lowId)) {
							if (!grouped[high.id]) {
								grouped[high.id] = {
									high: high,
									low: []
								};
							}
							const lowObj = lowEffects.find(le => le.id === lowId);
							if (lowObj) grouped[high.id].low.push(lowObj);
						}
					});
				});
				for (const highId in grouped) {
					const high = grouped[highId].high;
					const lows = grouped[highId].low;
					const lowLinks = lows.map(le => `<a href="#" onclick="showPopup('${le.id}', 'low-effect', globalData)">${le.name}</a>`).join(", ");
					content += `<p class="effectshow"><strong><a href="#" onclick="showPopup('${high.id}', 'high-effect', globalData)">${high.name}</a>:</strong> ${lowLinks}</p>`;
				}
			}
			
			// Examples
			if (item.example?.length > 0) {
				content += `<h3>Examples</h3><table border="1" width="100%">
					<tr><th>Reference</th><th>Description</th></tr>`;
				item.example.forEach(ex => {
					const ref = data.references.find(r => r.ID === ex["reference ID"]);
					const refLink = ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : ex["reference ID"];
					content += `<tr><td>${refLink}</td><td>${ex.description}</td></tr>`;
				});
				content += `</table>`;
			}

            // Show References (if any)
             if (item["reference_ID"]?.length > 0) {
				content += `<h3>References</h3><table border="1" width="100%">
					<tr><th>ID</th><th>Name</th><th>Link</th></tr>`;
				item["reference_ID"].forEach(refId => {
					let ref = data.references.find(r => r.ID === refId);
					if (ref) {
						content += `<tr>
							<td>${ref.ID}</td>
							<td class="clickable"><a href="#" onclick="showRefPopup(${JSON.stringify(ref).replace(/"/g, '&quot;')})">${ref.name}</a></td>
							<td><a href="${ref.link}" target="_blank">&#128065;</a></td>
						</tr>`;
					}
				});
				content += `</table>`;
			} else {
				content += `<p><h3>References:</h3> No references available.</p>`;
			}
        }
		
		// Handle NIST CRS Technique (similar to ATT&CK tactic)
		if (type === "nist-technique") {
			item = data.NIST_CRS.techniques.find(t => t.id === id);
			if (!item) return;

			content = `<h2>${item.name}</h2>`;
			content += `<p><i>ID:</i> ${item.id}</p>`;
			content += `<h3>Definition</h3><p>${item.definition}</p>`;
			content += `<h3>Purpose</h3><p>${item.purpose}</p>`;

			if (item.approach_ids?.length > 0) {
				const approachList = [];
				item.approach_ids.forEach(appId => {
					let app = data.NIST_CRS.approaches.find(a => a.id === appId);
					if (app) approachList.push(app);
				});

				if (approachList.length > 0) {
					content += `<h3>Approaches</h3><table border="1" width="100%">
						<tr><th>ID</th><th>Name</th><th style="width: 25%;">Definition</th><th>Example</th></tr>`;
					approachList.forEach(app => {
						content += `<tr>
							<td>${app.id}</td>
							<td><a href="#" onclick="showPopup('${app.id}', 'approach', globalData)">${app.name}</a></td>
							<td>${app.definition || "—"}</td>
							<td>${
							  app.example
								? app.example
									.replace(/\n\t/g, "<br>")
								: "—"
							}</td>
						</tr>`;
					});
					content += `</table>`;
				}
			} else {
				content += `<p><h3>Approaches:</h3> No approaches available.</p>`;
			}
		}


        // Handle NIST CRS Approach
        if (type === "approach") {
            item = data.NIST_CRS?.approaches?.find(a => a.id === id);
            if (!item) return;
            content = `<h2>${item.name}</h2>`;
            content += `<p><i>ID:</i> ${item.id}</p>`;
            content += `<h3>Definition</h3><p>${item.definition}</p>`;
            let formattedExample = item.example
				? item.example.replace(/\n\t*-/g, "<br>&nbsp;&nbsp;&nbsp;&nbsp;-").replace(/\n/g, "<br>")
				: "No example available.";
			content += `<h3>Example</h3><p>${formattedExample}</p>`;


            if (item.effect_ids?.length > 0) {
                content += `<h3>Associated Effects</h3><ul>`;
                item.effect_ids.forEach(eid => {
                    const e = data.NIST_CRS?.effects?.find(e => e.id === eid);
                    content += e
                        ? `<li><a href="#" onclick="showPopup('${e.id}', 'effect', globalData)">${e.name}</a></li>`
                        : `<li>${eid}</li>`;
                });
                content += `</ul>`;
            }
        }

        // Handle NIST CRS High-Level Effect
		if (type === "high-effect") {
			if (!item) return;
			content = `<h2>${item.name}</h2>`;
			content += `<p><i>ID:</i> ${item.id}</p>`;
			content += `<h3>Description</h3><p>${item.description}</p>`;
			content += `<p><strong>Impact on Risk:</strong> ${item.impact_on_risk}</p>`;
			content += `<p><strong>Expected Result:</strong> ${item.expected_result}</p>`;

			if (item.low_level_effects_ids?.length > 0) {
				content += `<h3>Low-Level Effects</h3><ul>`;
				item.low_level_effects_ids.forEach(lowId => {
					const le = data.NIST_CRS?.low_level_effects?.find(l => l.id === lowId);
					if (le) {
						content += `<li><a href="#" onclick="showPopup('${le.id}', 'low-effect', globalData)">${le.name}</a></li>`;
					}
				});
				content += `</ul>`;
			}
		}

		// Handle NIST CRS Low-Level Effect
		if (type === "low-effect") {
			if (!item) return;
			content = `<h2>${item.name}</h2>`;
			content += `<p><i>ID:</i> ${item.id}</p>`;
			content += `<h3>Description</h3><p>${item.description}</p>`;
			content += `<p><strong>Impact on Risk:</strong> ${item.impact_on_risk}</p>`;
			content += `<p><strong>Expected Result:</strong><br>${item.expected_result.replace(/\n/g, "<br>")}</p>`;
			if (item.examples) {
				content += `<h3>Examples</h3><p>${item.examples.replace(/\n/g, "<br>")}</p>`;
			}
		}
		
		document.getElementById("popup").style.display = "block";
		popupBody.innerHTML = content;
            
    }
    
   
	function handleReferenceClick(element) {
		let ref = JSON.parse(element.getAttribute("data-ref"));
		//let ref = JSON.parse(decodeURIComponent(element.getAttribute("data-ref")));
		showRefPopup(ref);
	}

		
	function showRefPopup(ref) {
		const popup = document.getElementById("popup");
		const popupBody = document.getElementById("popup-body");
		let refContent = `<h3>${ref.name}</h3>
                      <p>${ref.cite}</p>
                      <a href="${ref.link}" target="_blank">Open link</a>`;    
		let description = ref.description ? ref.description.replace(/\n/g, "<br><br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;"): "No description available.";
    
		refContent += `<h3>Description:</h3> <p>${description}</p>`;
		popupBody.innerHTML = refContent;
		popup.style.display = "block";
	}

	
	function closePopup() {
        document.getElementById("popup").style.display = "none";
    }
	
	
	
	
window.showPopup = showPopup;
window.closePopup = closePopup;
window.toggleSubTechniques = toggleSubTechniques;
	
	
	
	
	
	
	
	
