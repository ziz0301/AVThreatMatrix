document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("nav");

    menuToggle.addEventListener("click", function () {
        nav.classList.toggle("active");
    });
});

document.addEventListener("DOMContentLoaded", function() {
	fetch('data.json')
		.then(response => response.json())
		.then(data => {
			const matrixContainer = document.getElementById("matrix-container");
			data.tactics.forEach(tactic => {
				let tacticDiv = document.createElement("div");
				tacticDiv.classList.add("tactic");
				tacticDiv.innerHTML = `<b><a href="#" onclick="showPopup('${tactic.ID}', 'tactic')">${tactic.name}</a></b>`;
				
				tactic["technique ID"].forEach(techId => {
					let tech = data.techniques.find(t => t.ID === techId);
					if (tech) {
						let techDiv = document.createElement("div");
						techDiv.classList.add("techniques");
						
						let toggleButton = "";
						if (tech["sub-technique ID"].length > 0) {
							toggleButton = `<button class="toggle-btn" onclick="toggleSubTechniques(event, '${tech.ID}')">[+]</button>`;
						}
						
						techDiv.innerHTML = `${toggleButton} <a href="#" onclick="showPopup('${tech.ID}', 'technique')">${tech.name}</a>`;
						
						let subTechContainer = document.createElement("div");
						subTechContainer.id = `sub-tech-${tech.ID}`;
						subTechContainer.classList.add("sub-techniques");
						
						tech["sub-technique ID"].forEach(subTechId => {
							let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
							if (subTech) {
								let subTechDiv = document.createElement("div");
								subTechDiv.classList.add("sub-techniques-item")
								subTechDiv.innerHTML = `<a href="#" onclick="showPopup('${subTech.ID}', 'sub-technique')">${subTech.name}</a>`;
								subTechContainer.appendChild(subTechDiv);
							}
						});
						
						techDiv.appendChild(subTechContainer);
						tacticDiv.appendChild(techDiv);
					}
				});
				
				matrixContainer.appendChild(tacticDiv);
			});
		})
		.catch(error => console.error("Error loading data:", error));
    });

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
    
    function showPopup(id, type) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                let popupBody = document.getElementById("popup-body");
                let item = (type === "tactic") ? data.tactics.find(t => t.ID === id) : 
                           (type === "technique") ? data.techniques.find(t => t.ID === id) :
                           data["sub-techniques"].find(st => st.ID === id);
                if (!item) return;
                
                let content = `<h2>${item.name}</h2>`;
                content += `<p><i>ID:</i> ${item.ID}</p>`;
				content += `<p><strong>Created:</strong> ${item.created} | <strong>Last Modified:</strong> ${item.last_modified}</p>`;
                content += `<h3>Description:</h3> <p>${item["short description"] ? item["short description"]
							.replace(/\n/g, "<br><br>")
						    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")	: "No short description available."}</p>`;

				content += `<p>${item["full description"] ? item["full description"]
							.replace(/\n/g, "<br><br>")  
							.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;") : "No full description available."}</p>`;
                
                if (type === "tactic" && item["technique ID"].length > 0) {
                    content += `<b>Techniques</b>`;
                    content += `<table border="1" width="100%">
                        <tr><th>ID</th><th>Name</th><th>Description</th></tr>`;
                    item["technique ID"].forEach(techId => {
                        let tech = data.techniques.find(t => t.ID === techId);
                        if (tech) {
                            content += `<tr><td>${tech.ID}</td>
                                        <td><a href="#" onclick="showPopup('${tech.ID}', 'technique')">${tech.name}</a></td>
                                        <td>${tech.description}</td></tr>`;
                            tech["sub-technique ID"].forEach(subTechId => {
                                let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
                                if (subTech) {
                                    content += `<tr class="sub-technique-row">
                                                <td>${subTech.ID}</td>
                                                <td>${subTech.name}</td>
                                                <td>${subTech.description}</td></tr>`;
                                }
                            });
                        }
                    });
                    content += `</table>`;
                }
                
                if (type === "technique") {
                    if (item["sub-technique ID"].length > 0) {
                        content += `<b>Sub-Techniques</b><table border="1" width="100%">
                            <tr><th>ID</th><th>Name</th><th>Description</th></tr>`;
                        item["sub-technique ID"].forEach(subTechId => {
                            let subTech = data["sub-techniques"].find(st => st.ID === subTechId);
                            if (subTech) {
                                content += `<tr class="sub-technique-row">
                                            <td>${subTech.ID}</td>
                                            <td>${subTech.name}</td>
                                            <td>${subTech.description}</td></tr>`;
                            }
                        });
                        content += `</table>`;
                    }
                    
                    if (item["example"].length > 0) {
                        content += `<b>Examples</b><table border="1" width="100%">
                            <tr><th>Reference</th><th>Description</th></tr>`;
                        item["example"].forEach(ex => {
                            let ref = data.references.find(r => r.ID === ex["reference ID"]);
                            let refLink = ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
                            content += `<tr><td>${refLink}</td><td>${ex.description}</td></tr>`;
                        });
                        content += `</table>`;
                    }
                    
                    if (item["mitigation ID"].length > 0) {
                        content += `<b>Mitigations</b><table border="1" width="100%">
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
                    
                    if (item["reference ID"].length > 0) {
                        content += `<b>References</b><ul>`;
                        item["reference ID"].forEach(refId => {
                            let ref = data.references.find(r => r.ID === refId);
                            if (ref) {
                                content += `<li>[${ref.ID}] <a href='${ref.link}' target='_blank'>${ref.name}</a></li>`;
                            }
                        });
                        content += `</ul>`;
                    }
                }
				if (type === "sub-technique") {
                    if (item["example"]?.length > 0) {
                        content += `<b>Examples</b><table border="1" width="100%">
                            <tr><th>Reference</th><th>Description</th></tr>`;
                        item["example"].forEach(ex => {
                            let ref = data.references.find(r => r.ID === ex["reference ID"]);
                            let refLink = ref ? `<a href='${ref.link}' target='_blank'>${ref.name}</a>` : "Unknown Reference";
                            content += `<tr><td>${refLink}</td><td>${ex.description}</td></tr>`;
                        });
                        content += `</table>`;
                    }
                    
                    if (item["mitigation ID"]?.length > 0) {
                        content += `<b>Mitigations</b><table border="1" width="100%">
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
                        content += `<b>References</b><ul>`;
                        item["reference ID"].forEach(refId => {
                            let ref = data.references.find(r => r.ID === refId);
                            if (ref) {
                                content += `<li>[${ref.ID}] <a href='${ref.link}' target='_blank'>${ref.name}</a></li>`;
                            }
                        });
                        content += `</ul>`;
                    }
                }
                
                document.getElementById("popup").style.display = "block";
                popupBody.innerHTML = content;
            });
    }
    
    function closePopup() {
        document.getElementById("popup").style.display = "none";
    }
	
window.showPopup = showPopup;
window.closePopup = closePopup;
window.toggleSubTechniques = toggleSubTechniques;
	
	
	
	
	
	
	
	
