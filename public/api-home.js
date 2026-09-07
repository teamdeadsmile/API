fetch("/swagger.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch OpenAPI specification.");
    }

    return response.json();
  })
  .then((data) => {
    const list = document.getElementById("routes");

    if (!list) return;

    list.innerHTML = "";

    if (!data.paths || Object.keys(data.paths).length === 0) {
      list.innerHTML = `
        <li>
          <span
            style="
              color: #888888;
              font-size: 13px;
            "
          >
            No endpoints available.
          </span>
        </li>
      `;

      return;
    }

    for (const [path, methods] of Object.entries(data.paths)) {
      for (const method of Object.keys(methods)) {
        const li = document.createElement("li");

        const methodElement = document.createElement("span");
        methodElement.className = `method ${method.toLowerCase()}`;
        methodElement.textContent = method.toUpperCase();

        const link = document.createElement("a");
        link.className = "endpoint-link";
        link.href = path;
        link.textContent = path;

        li.appendChild(methodElement);
        li.appendChild(link);

        list.appendChild(li);
      }
    }
  })
  .catch(() => {
    const list = document.getElementById("routes");

    if (!list) return;

    list.innerHTML = `
      <li>
        <span
          style="
            color: #888888;
            font-size: 13px;
          "
        >
          Failed to fetch routes.
        </span>
      </li>
    `;
  });