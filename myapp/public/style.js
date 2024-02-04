const darkGridLineColor = 'grey';
const lightGridLineColor = '#626200';

function changeChartMode(myChart, dark){
    if (!dark) {
        myChart.options.scales.x.grid.color = darkGridLineColor;
        myChart.options.scales.y.grid.color = darkGridLineColor;
        myChart.options.scales.y.ticks.color = lightGridLineColor;
        myChart.options.scales.x.ticks.color = lightGridLineColor;
      } else {
        myChart.options.scales.x.grid.color = lightGridLineColor;
        myChart.options.scales.y.grid.color = lightGridLineColor;
        myChart.options.scales.y.ticks.color = lightGridLineColor;
        myChart.options.scales.x.ticks.color = lightGridLineColor;
      }
      myChart.update();

}

function changeCSS(dark){
    if (dark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('dark-mode', "dark");
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('dark-mode', "light");
    }
    
}

function isLocalhost() {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

default_mode = "dark";


document.getElementById('darkMode').addEventListener('click', () => {
    let toDarkMode = document.getElementById('darkMode').checked;
    if(window.daily_chart  && window.global_chart){
        if(toDarkMode){
            localStorage.setItem('color_line', lightGridLineColor);
        }
        else{
            localStorage.setItem('color_line', darkGridLineColor);
        }
        changeChartMode(window.daily_chart, toDarkMode);
        changeChartMode(window.global_chart, toDarkMode);
    }
    changeCSS(toDarkMode);


});
let storedMode = localStorage.getItem('dark-mode');
if (storedMode) {
    default_mode = storedMode;
}
if(default_mode == "dark"){
    document.getElementById('darkMode').checked = true;
    localStorage.setItem('color_line', lightGridLineColor);
    changeCSS(true);
} else {
    document.getElementById('darkMode').checked = false;
    localStorage.setItem('color_line', darkGridLineColor);
    changeCSS(false);
}

if (!isLocalhost()) {
    document.getElementById('adminLink').style.display = 'none';
}

