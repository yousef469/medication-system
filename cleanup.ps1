# Medical Hub Cleanup Script
echo "Stopping existing services..."

# Kill Python processes on 8001
$pids = (netstat -ano | findstr :8001 | ForEach-Object { $_.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -Unique)
foreach ($pid in $pids) {
    if ($pid -ne 0) {
        echo "Killing PID $pid (Port 8001)"
        taskkill /F /PID $pid /T
    }
}

# Kill Node processes on 5173
$pids = (netstat -ano | findstr :5173 | ForEach-Object { $_.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)[-1] } | Select-Object -Unique)
foreach ($pid in $pids) {
    if ($pid -ne 0) {
        echo "Killing PID $pid (Port 5173)"
        taskkill /F /PID $pid /T
    }
}

echo "Cleanup complete. You can now restart your services."
