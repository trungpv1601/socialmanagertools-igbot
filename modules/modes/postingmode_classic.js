/**
 * MODE: postingmode_realistic
 * =====================
 * Publish an array of photos with minimal delay.
 *
 * NOTE: Experimental mode.
 * 
 * @license: This code and contributions have 'MIT License'
 *
 */
const Log = require("./../logger/log");
const Translate = require("./../commons/translate");
const Api = require("./../routes/api");
const Utils = require("./../commons/utils");
const Status = require("./../logger/state").Status;
const STATE = require("./../logger/state").STATE;
const STATE_EVENTS = require("./../logger/state").STATE_EVENTS;
const core = require("./../core/core");

class Postingmode_classic extends Status {
	constructor() {
		super();
		this.core = core;
		this.LOG_NAME = "postingmode_classic";
		this.log = new Log(this.LOG_NAME);
		this.lang = new Translate();
		this.utils = new Utils();

		this.local = {};
		this.local.cache_post = [];
		this.local.current_post = [];

		this.api = {};
		this.api.click = new Api.Click();
		this.api.check = new Api.Check();
		this.api.goto = new Api.Goto();
		this.api.posting = new Api.Posting();
		this.api.read = new Api.Read();
		this.api.write = new Api.Write();
		this.api.page = new Api.Page();
		this.api.stories = new Api.Stories();
		this.api.database = new Api.Database();
		this.api.analytics = new Api.Analytics();
	}

	/**
	 * Postingmode classic Flow
	 * =====================
	 * Run this flow
	 *
	 */
	async flow() {
		let tag = "postingmode_classic::flow()";
		this.log.info(tag, `${this.lang.translate("loading")}`);

		let alive = {"status": true};

		await this.api.database.init(this.LOG_NAME);

		do {
			let today = new Date();
			this.log.info(tag, `${this.lang.translate("current_time_night")}: ${parseInt(`${today.getHours()}${today.getMinutes() < 10 ? "0" : ""}${today.getMinutes()}`)}`);

			let is_sleep_night_flag_enabled = this.core.config.bot_mode_options[this.core.config.bot_mode].sleep_night === "enabled";
			let is_day = (parseInt(`${today.getHours()}${today.getMinutes() < 10 ? "0" : ""}${today.getMinutes()}`) >= (this.core.config.bot_mode_options[this.core.config.bot_mode].sleep_end).replace(":", ""));

			if (!is_sleep_night_flag_enabled || is_day) {
				this.log.info(tag, `${this.lang.translate("photo_cache_size")}: ${this.local.cache_post.length}`);

				if (this.local.cache_post.length <= 0) {
					this.local.cache_post = this.core.config.bot_mode_options[this.core.config.bot_mode].post_list.slice();
				}

				this.local.current_post = this.local.cache_post.pop();

				await this.utils.sleep(this.utils.random_interval(1, 3));

				this.log.debug(tag, `${this.lang.translate("post_info")} ${this.local.current_post.uri} with caption ${this.local.current_post.caption}`);

		        await this.api.posting.post(this.local.current_post.uri, this.local.current_post.caption);

				let json = {
					"account": this.core.config.account.username,
					"post_photo": this.local.current_post.uri,
					"caption": this.local.current_post.caption
				};
				await this.api.database.insert(json);

				if (this.local.cache_post.length == 0) {
					alive.status = false;
					break;
				}

			} else {
				this.log.info(tag, this.lang.translate("is_night_bot_sleep"));
				await this.utils.sleep(this.utils.random_interval(60 * 4, 60 * 5));

				alive = await this.utils.keep_alive();
				if (alive == false) {
					break;
				}
			}

			alive = await this.api.page.keep_alive();

			this.emit(STATE_EVENTS.CHANGE_STATUS, STATE.OK);
		} while (alive.status);

		this.emit(STATE_EVENTS.CHANGE_STATUS, STATE.ERROR);

		return false;
	}

}

module.exports = Postingmode_classic;