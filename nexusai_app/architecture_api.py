from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ArchConnection, ArchNode, Project


ALLOWED_NODE_TYPES = {value for value, _label in ArchNode.NODE_TYPES}
MAX_NODES = 10
MAX_CONNECTIONS = 24


def _serialize_architecture(project):
    nodes = list(ArchNode.objects.filter(project=project).order_by("id"))
    connections = ArchConnection.objects.filter(project=project).select_related(
        "from_node", "to_node"
    ).order_by("id")

    return {
        "success": True,
        "nodes": [
            {
                "id": f"node-{node.id}",
                "type": node.node_type,
                "label": node.label,
                "sublabel": node.sublabel,
                "x": node.pos_x,
                "y": node.pos_y,
                "status": node.status,
                "metrics": {"cpu": node.cpu, "latency": node.latency},
            }
            for node in nodes
        ],
        "connections": [
            {
                "id": f"connection-{connection.id}",
                "from": f"node-{connection.from_node_id}",
                "to": f"node-{connection.to_node_id}",
                "label": connection.label,
                "protocol": connection.protocol,
            }
            for connection in connections
        ],
    }


@api_view(["GET", "PUT"])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def project_architecture(request, project_id):
    project = get_object_or_404(Project, pk=project_id, owner=request.user)

    if request.method == "GET":
        return Response(_serialize_architecture(project))

    raw_nodes = request.data.get("nodes")
    raw_connections = request.data.get("connections", [])

    if not isinstance(raw_nodes, list) or not 3 <= len(raw_nodes) <= MAX_NODES:
        return Response(
            {"success": False, "detail": f"Architecture must contain between 3 and {MAX_NODES} nodes."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not isinstance(raw_connections, list) or len(raw_connections) > MAX_CONNECTIONS:
        return Response(
            {"success": False, "detail": "Architecture contains too many connections."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_nodes = []
    client_ids = set()
    for index, node in enumerate(raw_nodes):
        if not isinstance(node, dict):
            return Response({"success": False, "detail": "Invalid architecture node."}, status=400)
        client_id = str(node.get("id", f"node-{index + 1}"))[:80]
        node_type = str(node.get("type", "service"))
        label = str(node.get("label", "")).strip()
        sublabel = str(node.get("sublabel", "")).strip()
        if not client_id or client_id in client_ids:
            return Response({"success": False, "detail": "Architecture node IDs must be unique."}, status=400)
        if node_type not in ALLOWED_NODE_TYPES:
            return Response({"success": False, "detail": f"Unsupported node type: {node_type}."}, status=400)
        if not label:
            return Response({"success": False, "detail": "Every architecture node needs a label."}, status=400)
        try:
            x = int(node.get("x", 100))
            y = int(node.get("y", 100))
        except (TypeError, ValueError):
            return Response({"success": False, "detail": "Node positions must be numeric."}, status=400)
        if not (0 <= x <= 1000 and 0 <= y <= 600):
            return Response({"success": False, "detail": "Node positions are outside the canvas."}, status=400)
        metrics = node.get("metrics") if isinstance(node.get("metrics"), dict) else {}
        validated_nodes.append({
            "client_id": client_id,
            "node_type": node_type,
            "label": label[:255],
            "sublabel": sublabel[:255],
            "x": x,
            "y": y,
            "status": str(node.get("status", "healthy"))[:50],
            "cpu": str(metrics.get("cpu", "n/a"))[:20],
            "latency": str(metrics.get("latency", "n/a"))[:20],
        })
        client_ids.add(client_id)

    validated_connections = []
    for connection in raw_connections:
        if not isinstance(connection, dict):
            continue
        source = str(connection.get("from", ""))
        target = str(connection.get("to", ""))
        if source not in client_ids or target not in client_ids or source == target:
            continue
        validated_connections.append({
            "from": source,
            "to": target,
            "label": str(connection.get("label", ""))[:255],
            "protocol": str(connection.get("protocol", "HTTP/JSON"))[:50],
        })

    with transaction.atomic():
        ArchConnection.objects.filter(project=project).delete()
        ArchNode.objects.filter(project=project).delete()
        node_map = {}
        for node in validated_nodes:
            created = ArchNode.objects.create(
                project=project,
                label=node["label"],
                sublabel=node["sublabel"],
                node_type=node["node_type"],
                pos_x=node["x"],
                pos_y=node["y"],
                status=node["status"],
                cpu=node["cpu"],
                latency=node["latency"],
            )
            node_map[node["client_id"]] = created

        for connection in validated_connections:
            ArchConnection.objects.create(
                project=project,
                from_node=node_map[connection["from"]],
                to_node=node_map[connection["to"]],
                label=connection["label"],
                protocol=connection["protocol"],
            )

    payload = _serialize_architecture(project)
    payload["message"] = "Architecture saved successfully."
    return Response(payload, status=status.HTTP_200_OK)
