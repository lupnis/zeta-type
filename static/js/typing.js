const _token = (new URLSearchParams(window.location.search).get('token')),
    indicator_container = document.querySelector('.content_text'),
    input_field = document.querySelector('.input_field');

var articleText = '',
    time_total = 0,
    time_left = 0,
    count_incorrects = 0,
    flag_started = false,
    wpm = 0,
    timing_function,
    finished = false,
    offset_farthest = 0;

function get_article() {
    $.ajax({
        url: '/get_article',
        method: 'GET',
        data: {
            token: _token
        },
        success: function (data) {
            let _raw = eval(data);
            articleText = _raw.article_data;
            time_total = _raw.total_time;
            init_article();
            init_eve();
        },
        error: function () {
            let temp_lb = document.querySelector('.content_text span');
            temp_lb.innerText = 'LOAD FAILED';
            temp_lb.className = 'incorrect';
        },
        async: false

    });
}

function upload_score() {
    $.ajax({
        url: '/submit',
        method: 'POST',
        data: {
            token: _token,
            wpm: wpm,
            time_left:time_left,
            mistakes:count_incorrects
        },
        success: function (data) {
            indicator_container.innerHTML = '<span class="correct">UPLOAD SCORES SUCCEEDED</span>';
        },
        error: function (data) {
            indicator_container.innerHTML = '<span class="incorrect">UPLOAD SCORES FAILED</span>';
        },
        async: false

    });
}

function init_article() {
    let temp_lb = document.querySelector('.content_text span');
    temp_lb.remove();
    articleText.split('').forEach(c => {
        if (c == '\n') {
            indicator_container.innerHTML += '<br>';
        } else {
            if (c == ' ') c = '&nbsp;';
            let _span = `<span>${c}</span>`;
            indicator_container.innerHTML += _span;
        }
    });
    indicator_container.querySelectorAll('span')[0].classList.add('current');
    document.addEventListener('keydown', () => input_field.focus());
    indicator_container.addEventListener('click', () => input_field.focus());
    input_field.focus();
    time_left = time_total;
}

function typing_judge(e) {
    let chars = indicator_container.querySelectorAll('span');
    let typed_length = input_field.value.length;
    offset_farthest = Math.max(offset_farthest, typed_length);
    if (!finished) {
        count_incorrects=0;
        if (!flag_started) {
            timing_function = setInterval(count_down, 1000);
            flag_started = true;
        }
        if (typed_length === 0) {
            for (let i = 0; i <= offset_farthest; i++) {
                chars[i].classList.remove('current', 'correct', 'incorrect');
            }
            count_incorrects = 0;
            offset_farthest = typed_length;
            chars[0].classList.remove('correct', 'incorrect');
            chars[0].classList.add('current');
        }
        if (typed_length > 0 && typed_length <= chars.length) {
            let _c1 = chars[typed_length - 1].innerHTML;
            let _c2 = chars[typed_length - 1].innerText;
            let _cr = input_field.value[typed_length - 1];
            if (_cr == ' ') {
                _cr = '&nbsp;';
            }
            if (_cr === _c1 || _cr === _c2) {
                chars[typed_length - 1].classList.remove('current', 'correct', 'incorrect');
                chars[typed_length - 1].classList.add('correct');
            } else {
                chars[typed_length - 1].classList.remove('current', 'correct', 'incorrect');
                chars[typed_length - 1].classList.add('incorrect');
            }
            for (let i = typed_length; i <= Math.min(offset_farthest, chars.length - 1); i++) {
                chars[i].classList.remove('current', 'correct', 'incorrect');
            }
            for (let i = 0; i < typed_length; i++) {
                chars[i].classList.remove('current', 'correct', 'incorrect');
                let c = input_field.value[i];
                if (c == ' ') {
                    c = '&nbsp;';
                }
                if (c === chars[i].innerHTML || c === chars[i].innerText) { chars[i].classList.add('correct'); }
                else {
                    chars[i].classList.add('incorrect');
                    count_incorrects++;
                }
            }
            offset_farthest = typed_length;
            if (typed_length === chars.length) {
                if ((_cr === _c1 || _cr === _c2) && !finished) {
                    finished = true;
                    count_down();
                }
            }
            else {
                chars[typed_length].classList.remove('correct', 'incorrect');
                chars[typed_length].classList.add('current');
                indicator_container.scrollTo(0, chars[typed_length - 1].offsetTop - indicator_container.offsetTop);
            }
        }
        wpm = Math.round(0.6 * (input_field.value.length - count_incorrects) / (time_total - time_left) * 60);
        wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
        update_values();
    }
}

function finish_judge(e) {
    if (e.key == 'Enter') {
        if (input_field.value.length === indicator_container.querySelectorAll('span').length && !finished) {
            finished = true;
            count_down();
        }
    }
}

function update_values() {
    let remain_mm = Math.floor(time_left / 60);
    let remain_ss = time_left % 60;
    remain_mm = remain_mm < 10 ? ('0' + remain_mm) : remain_mm;
    remain_ss = remain_ss < 10 ? ('0' + remain_ss) : remain_ss;
    document.getElementById('time_left').innerText = `${remain_mm}:${remain_ss}`;
    document.getElementById('mistakes').innerText = count_incorrects;
    document.getElementById('wpm').innerText = wpm;
}

function count_down() {
    if (time_left > 0 && !finished) {
        time_left--;
        wpm = Math.round(0.6 * (input_field.value.length - count_incorrects) / (time_total - time_left) * 60);
        update_values();
    }
    else {
        finished = true;
        clearInterval(timing_function);
        upload_score();
    }
}

function init_eve() {
    input_field.addEventListener('keypress', finish_judge);
    input_field.addEventListener('input', typing_judge);
    input_field.onpaste = function(){return false;};
}

get_article();