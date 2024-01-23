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
    } else {
        document.body.classList.remove('dark-mode');
    }
}



default_mode = "dark";

document.getElementById('darkMode').addEventListener('click', () => {
    
    let toDarkMode = document.getElementById('darkMode').checked;
    if(toDarkMode){
        localStorage.setItem('color_line', lightGridLineColor);
    }
    else{
        localStorage.setItem('color_line', darkGridLineColor);
    }
    changeChartMode(window.daily_chart, toDarkMode);
    changeChartMode(window.global_chart, toDarkMode);
    changeCSS(toDarkMode);


});

if(default_mode == "dark"){
    document.getElementById('darkMode').checked = true;
    localStorage.setItem('color_line', lightGridLineColor);
    changeCSS(true);
} else {
    document.getElementById('darkMode').checked = false;
    localStorage.setItem('color_line', darkGridLineColor);
    changeCSS(false);
}


